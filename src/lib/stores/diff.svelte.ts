import {
	getBranchToWorkdirSummary,
	getBranchToWorkdirFileDiff,
	getWorkdirSummary,
	listRepoFiles,
	readRepoFile,
	type DiffSummary,
	type FileDiff,
	type FileSummary
} from '$lib/services/git';
import { repoStore } from './repo.svelte';

export type ViewMode = 'unified' | 'split' | 'full';
export type TreeMode = 'diffs' | 'all';

class DiffStore {
	viewMode = $state<ViewMode>('unified');
	treeMode = $state<TreeMode>('diffs');

	fromRef = $state('');
	toRef = $state('');

	summary = $state<DiffSummary | null>(null);
	selectedFile = $state<FileSummary | null>(null);
	fileDiff = $state<FileDiff | null>(null);

	allFiles = $state<string[]>([]);
	selectedRepoFile = $state<string | null>(null);
	fullFileContent = $state<string | null>(null);

	localChangesCount = $state(0);
	pendingWorkdirChange = $state(false);

	loading = $state(false);
	fileLoading = $state(false);
	error = $state('');
	retryAction = $state<(() => void) | null>(null);

	searchOpen = $state(false);
	searchQuery = $state('');
	currentMatchIndex = $state(0);
	searchMatchCount = $state(0);

	selectedFileIndex = $derived(
		this.summary?.files.findIndex((f) => f.path === this.selectedFile?.path) ?? -1
	);

	reset() {
		this.fromRef = '';
		this.toRef = '';
		this.summary = null;
		this.selectedFile = null;
		this.fileDiff = null;
		this.allFiles = [];
		this.selectedRepoFile = null;
		this.fullFileContent = null;
		this.localChangesCount = 0;
		this.pendingWorkdirChange = false;
		this.loading = false;
		this.fileLoading = false;
		this.error = '';
		this.retryAction = null;
		this.treeMode = 'diffs';
	}

	async refreshLocalChanges() {
		try {
			const workdir = await getWorkdirSummary(repoStore.path);
			this.localChangesCount = workdir.files.length;
		} catch {
			this.localChangesCount = 0;
		}
	}

	// toRef is the base/target branch (e.g. "main"); diffs against working directory
	async reload() {
		if (this.fromRef && this.toRef) {
			await this.loadBranchDiff(this.fromRef, this.toRef);
		}
	}

	async loadBranchDiff(fromRef: string, toRef: string) {
		this.loading = true;
		this.error = '';
		this.fromRef = fromRef;
		this.toRef = toRef;
		try {
			this.pendingWorkdirChange = false;
			this.summary = await getBranchToWorkdirSummary(repoStore.path, toRef);
			this.selectedFile = null;
			this.fileDiff = null;
			if (this.summary.files.length > 0) {
				await this.selectFile(this.summary.files[0]);
			}
		} catch (e) {
			this.error = String(e);
			this.retryAction = () => this.loadBranchDiff(fromRef, toRef);
		} finally {
			this.loading = false;
		}
	}

	async selectFile(file: FileSummary) {
		this.selectedFile = file;
		this.fileLoading = true;
		try {
			this.fileDiff = await getBranchToWorkdirFileDiff(repoStore.path, this.toRef, file.path);
		} catch (e) {
			this.error = String(e);
			this.retryAction = () => this.selectFile(file);
		} finally {
			this.fileLoading = false;
		}
	}

	selectNextFile() {
		if (!this.summary) return;
		const idx = this.selectedFileIndex;
		if (idx < this.summary.files.length - 1) {
			this.selectFile(this.summary.files[idx + 1]);
		}
	}

	selectPrevFile() {
		if (!this.summary) return;
		const idx = this.selectedFileIndex;
		if (idx > 0) {
			this.selectFile(this.summary.files[idx - 1]);
		}
	}

	async loadAllFiles() {
		try {
			this.allFiles = await listRepoFiles(repoStore.path);
		} catch (e) {
			this.error = String(e);
		}
	}

	async selectRepoFile(filePath: string) {
		this.selectedRepoFile = filePath;
		this.selectedFile = null;
		this.fileDiff = null;
		this.fileLoading = true;
		try {
			this.fullFileContent = await readRepoFile(repoStore.path, filePath);
		} catch (e) {
			this.error = String(e);
		} finally {
			this.fileLoading = false;
		}
	}

	async setTreeMode(mode: TreeMode) {
		this.treeMode = mode;
		if (mode === 'all' && this.allFiles.length === 0) {
			await this.loadAllFiles();
		}
	}

	openSearch() {
		this.searchOpen = true;
	}

	closeSearch() {
		this.searchOpen = false;
		this.searchQuery = '';
		this.currentMatchIndex = 0;
		this.searchMatchCount = 0;
	}

	nextMatch() {
		if (this.searchMatchCount > 0) {
			this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatchCount;
			this.scrollToCurrentMatch();
		}
	}

	prevMatch() {
		if (this.searchMatchCount > 0) {
			this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatchCount) % this.searchMatchCount;
			this.scrollToCurrentMatch();
		}
	}

	scrollToCurrentMatch() {
		setTimeout(() => {
			const marks = document.querySelectorAll('.search-highlight');
			const current = marks[this.currentMatchIndex];
			if (current) {
				current.scrollIntoView({ block: 'center', behavior: 'smooth' });
				// Remove previous current highlight
				document.querySelector('.search-highlight.current')?.classList.remove('current');
				current.classList.add('current');
			}
		}, 0);
	}

	toggleViewMode() {
		if (this.viewMode === 'unified') this.viewMode = 'split';
		else if (this.viewMode === 'split') this.viewMode = 'full';
		else this.viewMode = 'unified';
	}
}

export const diffStore = new DiffStore();
