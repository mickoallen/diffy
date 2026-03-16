const STORAGE_KEY = 'diffy:recent-repos';
const MAX_RECENTS = 10;

export interface RecentRepo {
	path: string;
	name: string;
	openedAt: number;
}

class RecentsStore {
	repos = $state<RecentRepo[]>([]);

	constructor() {
		if (typeof localStorage !== 'undefined') {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) this.repos = JSON.parse(raw);
			} catch {
				this.repos = [];
			}
		}
	}

	add(path: string) {
		const name = path.split('/').filter(Boolean).pop() ?? path;
		this.repos = [
			{ path, name, openedAt: Date.now() },
			...this.repos.filter((r) => r.path !== path)
		].slice(0, MAX_RECENTS);
		this.#persist();
	}

	remove(path: string) {
		this.repos = this.repos.filter((r) => r.path !== path);
		this.#persist();
	}

	#persist() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.repos));
		} catch {}
	}
}

export const recentsStore = new RecentsStore();
