import {
	getBranchToWorkdirSummary,
	getBranchToWorkdirFileDiff,
	getStagedSummary,
	getStagedFileDiff,
	getUnstagedSummary,
	getUnstagedFileDiff,
	getWorkdirSummary,
	listRepoFiles,
	readRepoFile,
	type DiffSummary,
	type FileDiff,
	type FileSummary
} from '$lib/services/git';
import { repoStore } from './repo.svelte';
import { repoPrefsStore } from './repoPrefs.svelte';

export type ViewMode = 'unified' | 'split' | 'full';
export type TreeMode = 'diffs' | 'all';
export type DiffMode = 'branch' | 'staged' | 'unstaged';

class DiffStore {
	viewMode = $state<ViewMode>('unified');
	treeMode = $state<TreeMode>('diffs');
	diffMode = $state<DiffMode>('branch');
	ignoreWhitespace = $state(false);
	sidebarHidden = $state(false);
	foldContext = $state(false);
	collapsedHunks = $state<Set<string>>(new Set());

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
		this.diffMode = 'branch';
		this.ignoreWhitespace = false;
		this.sidebarHidden = false;
		this.foldContext = false;
		this.collapsedHunks = new Set();
	}

	toggleSidebar() {
		this.sidebarHidden = !this.sidebarHidden;
		repoPrefsStore.update({ sidebarHidden: this.sidebarHidden });
	}

	toggleFoldContext() {
		this.foldContext = !this.foldContext;
		repoPrefsStore.update({ foldContext: this.foldContext });
	}

	toggleHunkCollapsed(key: string) {
		const next = new Set(this.collapsedHunks);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		this.collapsedHunks = next;
	}

	isHunkCollapsed(key: string): boolean {
		return this.collapsedHunks.has(key);
	}

	async refreshLocalChanges() {
		try {
			const workdir = await getWorkdirSummary(repoStore.path);
			this.localChangesCount = workdir.files.length;
		} catch {
			this.localChangesCount = 0;
		}
	}

	private async fetchSummary(): Promise<DiffSummary> {
		const ws = this.ignoreWhitespace;
		switch (this.diffMode) {
			case 'staged':
				return getStagedSummary(repoStore.path, ws);
			case 'unstaged':
				return getUnstagedSummary(repoStore.path, ws);
			case 'branch':
			default:
				return getBranchToWorkdirSummary(repoStore.path, this.toRef, ws);
		}
	}

	private async fetchFileDiff(filePath: string): Promise<FileDiff> {
		const ws = this.ignoreWhitespace;
		switch (this.diffMode) {
			case 'staged':
				return getStagedFileDiff(repoStore.path, filePath, ws);
			case 'unstaged':
				return getUnstagedFileDiff(repoStore.path, filePath, ws);
			case 'branch':
			default:
				return getBranchToWorkdirFileDiff(repoStore.path, this.toRef, filePath, ws);
		}
	}

	// toRef is the base/target branch (e.g. "main"); diffs against working directory
	async reload() {
		if (this.diffMode !== 'branch' || (this.fromRef && this.toRef)) {
			await this.loadDiff();
		}
	}

	async loadBranchDiff(fromRef: string, toRef: string) {
		this.diffMode = 'branch';
		this.fromRef = fromRef;
		this.toRef = toRef;
		repoPrefsStore.update({ diffMode: 'branch', toRef });
		await this.loadDiff();
	}

	async setToRef(toRef: string) {
		this.toRef = toRef;
		repoPrefsStore.update({ toRef });
		await this.reload();
	}

	async setDiffMode(mode: DiffMode) {
		if (this.diffMode === mode) return;
		this.diffMode = mode;
		repoPrefsStore.update({ diffMode: mode });
		await this.loadDiff();
	}

	async toggleIgnoreWhitespace() {
		this.ignoreWhitespace = !this.ignoreWhitespace;
		repoPrefsStore.update({ ignoreWhitespace: this.ignoreWhitespace });
		await this.loadDiff();
	}

	async loadDiff() {
		this.loading = true;
		this.error = '';
		try {
			this.pendingWorkdirChange = false;
			this.summary = await this.fetchSummary();
			this.selectedFile = null;
			this.fileDiff = null;
			if (this.summary.files.length > 0) {
				await this.selectFile(this.summary.files[0]);
			}
		} catch (e) {
			this.error = String(e);
			this.retryAction = () => this.loadDiff();
		} finally {
			this.loading = false;
		}
	}

	async selectFile(file: FileSummary) {
		this.selectedFile = file;
		this.fileLoading = true;
		repoPrefsStore.update({ lastSelectedFile: file.path });
		try {
			this.fileDiff = await this.fetchFileDiff(file.path);
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
		repoPrefsStore.update({ treeMode: mode });
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
		repoPrefsStore.update({ viewMode: this.viewMode });
	}
}

export const diffStore = new DiffStore();
