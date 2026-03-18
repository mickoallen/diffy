import { diffStore } from '$lib/stores/diff.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { debugStore } from '$lib/stores/debug.svelte';

export const SHORTCUTS = [
	{ key: 'j', desc: 'Next file' },
	{ key: 'k', desc: 'Previous file' },
	{ key: 's', desc: 'Cycle view mode' },
	{ key: 'a', desc: 'Toggle AI panel' },
	{ key: 'r', desc: 'Refresh diff' },
	{ key: 'f', desc: 'Focus file filter' },
	{ key: '/', desc: 'Search in diff' },
	{ key: '?', desc: 'Show shortcuts' },
	{ key: 'Esc', desc: 'Close panel / search' }
];

export function setupKeyboardShortcuts() {
	function handler(e: KeyboardEvent) {
		// Don't handle if in input/textarea
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			e.target instanceof HTMLSelectElement
		) {
			return;
		}

		switch (e.key) {
			case 'j':
				diffStore.selectNextFile();
				break;
			case 'k':
				diffStore.selectPrevFile();
				break;
			case 's':
				diffStore.toggleViewMode();
				break;
			case 'a':
				settingsStore.toggleAiPanel();
				break;
			case 'r':
				diffStore.reload();
				break;
			case 'f':
				e.preventDefault();
				document.getElementById('file-filter')?.focus();
				break;
			case 'Escape':
				settingsStore.showSettings = false;
				settingsStore.showShortcuts = false;
				debugStore.show = false;
				diffStore.closeSearch();
				break;
			case '?':
				settingsStore.showShortcuts = !settingsStore.showShortcuts;
				break;
			case '/':
				e.preventDefault();
				diffStore.openSearch();
				break;
			case '`':
				debugStore.toggle();
				break;
		}
	}

	document.addEventListener('keydown', handler);
	return () => document.removeEventListener('keydown', handler);
}
