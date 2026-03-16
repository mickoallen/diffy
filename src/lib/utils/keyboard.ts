import { diffStore } from '$lib/stores/diff.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';

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
			case 'f':
				e.preventDefault();
				document.getElementById('file-filter')?.focus();
				break;
			case 'Escape':
				settingsStore.showSettings = false;
				break;
		}
	}

	document.addEventListener('keydown', handler);
	return () => document.removeEventListener('keydown', handler);
}
