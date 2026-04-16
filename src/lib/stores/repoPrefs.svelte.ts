import type { DiffMode, TreeMode, ViewMode } from './diff.svelte';

const KEY_PREFIX = 'diffy:prefs:';

function keyFor(repoPath: string): string {
	return KEY_PREFIX + repoPath;
}

export interface RepoPrefs {
	toRef?: string;
	diffMode?: DiffMode;
	viewMode?: ViewMode;
	ignoreWhitespace?: boolean;
	treeMode?: TreeMode;
	sidebarWidth?: number;
	sidebarHidden?: boolean;
	foldContext?: boolean;
	collapsedPaths?: string[];
	lastSelectedFile?: string;
}

class RepoPrefsStore {
	repoPath = $state('');
	current = $state<RepoPrefs>({});

	load(path: string): RepoPrefs {
		this.repoPath = path;
		if (!path || typeof localStorage === 'undefined') {
			this.current = {};
			return this.current;
		}
		try {
			const raw = localStorage.getItem(keyFor(path));
			this.current = raw ? (JSON.parse(raw) as RepoPrefs) : {};
		} catch {
			this.current = {};
		}
		return this.current;
	}

	update(patch: Partial<RepoPrefs>) {
		if (!this.repoPath) return;
		this.current = { ...this.current, ...patch };
		this.#persist();
	}

	clear() {
		this.repoPath = '';
		this.current = {};
	}

	#persist() {
		if (!this.repoPath || typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(keyFor(this.repoPath), JSON.stringify(this.current));
		} catch {}
	}
}

export const repoPrefsStore = new RepoPrefsStore();
