import { diffStore } from '$lib/stores/diff.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { debugStore } from '$lib/stores/debug.svelte';
import { reviewedStore } from '$lib/stores/reviewed.svelte';
import { paletteStore } from '$lib/stores/palette.svelte';
import { toastStore } from '$lib/stores/toast.svelte';

export const SHORTCUTS = [
	{ key: '⌘P', desc: 'Jump to file' },
	{ key: '⌘\\', desc: 'Toggle sidebar' },
	{ key: 'j', desc: 'Next file' },
	{ key: 'k', desc: 'Previous file' },
	{ key: 'n', desc: 'Next hunk' },
	{ key: 'p', desc: 'Previous hunk' },
	{ key: 'g g', desc: 'Top of diff' },
	{ key: 'G', desc: 'Bottom of diff' },
	{ key: ':', desc: 'Jump to line' },
	{ key: 's', desc: 'Cycle view mode' },
	{ key: 'w', desc: 'Toggle ignore whitespace' },
	{ key: 'v', desc: 'Toggle file reviewed' },
	{ key: 'c', desc: 'Toggle fold context lines' },
	{ key: 'a', desc: 'Toggle AI panel' },
	{ key: 'r', desc: 'Refresh diff' },
	{ key: 'f', desc: 'Focus file filter' },
	{ key: '/', desc: 'Search in diff' },
	{ key: '?', desc: 'Show shortcuts' },
	{ key: 'Esc', desc: 'Close panel / search' }
];

const G_COMBO_WINDOW_MS = 500;

function diffScrollContainer(): HTMLElement | null {
	return document.querySelector('.diff-view') as HTMLElement | null;
}

function hunksInOrder(): HTMLElement[] {
	return Array.from(document.querySelectorAll('.unified-diff .hunk, .split-diff .hunk')) as HTMLElement[];
}

function scrollToHunk(dir: 'next' | 'prev') {
	const hunks = hunksInOrder();
	if (hunks.length === 0) return;
	const container = diffScrollContainer();
	if (!container) return;
	const viewTop = container.getBoundingClientRect().top;
	// Current = first hunk whose top is at-or-after viewTop. Otherwise last hunk above viewTop.
	let currentIdx = hunks.findIndex((h) => h.getBoundingClientRect().top >= viewTop - 2);
	if (currentIdx === -1) currentIdx = hunks.length - 1;

	const targetIdx =
		dir === 'next' ? Math.min(hunks.length - 1, currentIdx + 1) : Math.max(0, currentIdx - 1);
	hunks[targetIdx]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function scrollDiffToEdge(edge: 'top' | 'bottom') {
	const container = diffScrollContainer();
	if (!container) return;
	container.scrollTo({
		top: edge === 'top' ? 0 : container.scrollHeight,
		behavior: 'smooth'
	});
}

function jumpToLine() {
	const input = window.prompt('Jump to line:');
	if (!input) return;
	const n = parseInt(input.trim(), 10);
	if (!Number.isFinite(n) || n <= 0) {
		toastStore.push(`Invalid line number: ${input}`, 'error');
		return;
	}
	// Prefer new-lineno (post-change side) then old-lineno as fallback.
	const target =
		(document.querySelector(`[data-new-lineno="${n}"]`) as HTMLElement | null) ??
		(document.querySelector(`[data-old-lineno="${n}"]`) as HTMLElement | null);
	if (!target) {
		toastStore.push(`Line ${n} not shown in the current diff`, 'info');
		return;
	}
	target.scrollIntoView({ block: 'center', behavior: 'smooth' });
	target.classList.add('line-flash');
	setTimeout(() => target.classList.remove('line-flash'), 1200);
}

export function setupKeyboardShortcuts() {
	let lastG = 0;

	function handler(e: KeyboardEvent) {
		// Cmd/Ctrl+P — quick file jumper. Handled even in inputs so it works from the filter.
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
			e.preventDefault();
			paletteStore.toggle();
			return;
		}

		// Cmd/Ctrl+\ — toggle sidebar.
		if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
			e.preventDefault();
			diffStore.toggleSidebar();
			return;
		}

		// Don't handle if in input/textarea
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			e.target instanceof HTMLSelectElement
		) {
			return;
		}

		// `g g` combo for top-of-diff
		if (e.key === 'g' && !e.shiftKey) {
			const now = performance.now();
			if (now - lastG < G_COMBO_WINDOW_MS) {
				scrollDiffToEdge('top');
				lastG = 0;
			} else {
				lastG = now;
			}
			return;
		}
		lastG = 0;

		switch (e.key) {
			case 'j':
				diffStore.selectNextFile();
				break;
			case 'k':
				diffStore.selectPrevFile();
				break;
			case 'n':
				scrollToHunk('next');
				break;
			case 'p':
				scrollToHunk('prev');
				break;
			case 'G':
				scrollDiffToEdge('bottom');
				break;
			case ':':
				e.preventDefault();
				jumpToLine();
				break;
			case 's':
				diffStore.toggleViewMode();
				break;
			case 'w':
				diffStore.toggleIgnoreWhitespace();
				break;
			case 'v':
				if (diffStore.selectedFile) reviewedStore.toggle(diffStore.selectedFile.path);
				break;
			case 'c':
				diffStore.toggleFoldContext();
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
