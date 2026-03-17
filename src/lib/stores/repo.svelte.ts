import { listBranches, openRepo, type BranchInfo } from '$lib/services/git';

class RepoStore {
	path = $state('');
	branches = $state<BranchInfo[]>([]);
	loading = $state(false);
	error = $state('');

	currentBranch = $derived(this.branches.find((b) => b.is_head)?.name ?? '');

	async open(path: string) {
		this.loading = true;
		this.error = '';
		try {
			this.path = await openRepo(path);
			this.branches = await listBranches(this.path);
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	reset() {
		this.path = '';
		this.branches = [];
		this.error = '';
		this.loading = false;
	}

	async refreshBranches() {
		if (!this.path) return;
		try {
			this.branches = await listBranches(this.path);
		} catch (e) {
			this.error = String(e);
		}
	}
}

export const repoStore = new RepoStore();
