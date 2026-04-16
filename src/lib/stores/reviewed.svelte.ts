const KEY_PREFIX = 'diffy:reviewed:';

function keyFor(repoPath: string): string {
	return KEY_PREFIX + repoPath;
}

class ReviewedStore {
	// Per-repo reviewed file paths. We keep an array in state so Svelte's reactivity
	// triggers on mutation; reads go through the Set for O(1) lookups.
	reviewed = $state<string[]>([]);
	repoPath = $state('');

	#set = new Set<string>();

	loadForRepo(path: string) {
		this.repoPath = path;
		if (!path || typeof localStorage === 'undefined') {
			this.reviewed = [];
			this.#set = new Set();
			return;
		}
		try {
			const raw = localStorage.getItem(keyFor(path));
			const arr = raw ? (JSON.parse(raw) as string[]) : [];
			this.reviewed = arr;
			this.#set = new Set(arr);
		} catch {
			this.reviewed = [];
			this.#set = new Set();
		}
	}

	clearForCurrentRepo() {
		if (!this.repoPath) return;
		this.reviewed = [];
		this.#set = new Set();
		this.#persist();
	}

	has(filePath: string): boolean {
		return this.#set.has(filePath);
	}

	toggle(filePath: string) {
		if (this.#set.has(filePath)) {
			this.#set.delete(filePath);
			this.reviewed = this.reviewed.filter((p) => p !== filePath);
		} else {
			this.#set.add(filePath);
			this.reviewed = [...this.reviewed, filePath];
		}
		this.#persist();
	}

	#persist() {
		if (!this.repoPath || typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(keyFor(this.repoPath), JSON.stringify(this.reviewed));
		} catch {}
	}
}

export const reviewedStore = new ReviewedStore();
