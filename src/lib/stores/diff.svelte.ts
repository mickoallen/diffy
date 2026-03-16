import {
	getDiffSummary,
	getFileDiff,
	getLocalVsRemote,
	getWorkdirSummary,
	getWorkdirFileDiff,
	listRepoFiles,
	readRepoFile,
	type DiffSummary,
	type FileDiff,
	type FileSummary
} from '$lib/services/git';
import { repoStore } from './repo.svelte';

export type CompareMode = 'local-vs-remote' | 'branch-vs-branch' | 'workdir';
export type ViewMode = 'unified' | 'split' | 'full';
export type TreeMode = 'diffs' | 'all';

class DiffStore {
	compareMode = $state<CompareMode>('local-vs-remote');
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

	loading = $state(false);
	fileLoading = $state(false);
	error = $state('');

	selectedFileIndex = $derived(
		this.summary?.files.findIndex((f) => f.path === this.selectedFile?.path) ?? -1
	);

	async loadWorkdirDiff() {
		this.loading = true;
		this.error = '';
		try {
			this.summary = await getWorkdirSummary(repoStore.path);
			this.fromRef = '';
			this.toRef = '';
			this.compareMode = 'workdir';
			if (this.summary.files.length > 0) {
				await this.selectFile(this.summary.files[0]);
			}
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	async loadLocalVsRemote() {
		this.loading = true;
		this.error = '';
		try {
			const [summary, upstream, branch] = await getLocalVsRemote(repoStore.path);
			this.summary = summary;
			this.fromRef = upstream;
			this.toRef = branch;
			this.compareMode = 'local-vs-remote';
			if (summary.files.length > 0) {
				await this.selectFile(summary.files[0]);
			}
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	async loadBranchDiff(fromRef: string, toRef: string) {
		this.loading = true;
		this.error = '';
		this.fromRef = fromRef;
		this.toRef = toRef;
		try {
			this.summary = await getDiffSummary(repoStore.path, fromRef, toRef);
			this.compareMode = 'branch-vs-branch';
			if (this.summary.files.length > 0) {
				await this.selectFile(this.summary.files[0]);
			}
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	async selectFile(file: FileSummary) {
		this.selectedFile = file;
		this.fileLoading = true;
		try {
			if (this.compareMode === 'workdir') {
				this.fileDiff = await getWorkdirFileDiff(repoStore.path, file.path);
			} else {
				this.fileDiff = await getFileDiff(repoStore.path, this.fromRef, this.toRef, file.path);
			}
		} catch (e) {
			this.error = String(e);
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

	toggleViewMode() {
		if (this.viewMode === 'unified') this.viewMode = 'split';
		else if (this.viewMode === 'split') this.viewMode = 'full';
		else this.viewMode = 'unified';
	}
}

export const diffStore = new DiffStore();
