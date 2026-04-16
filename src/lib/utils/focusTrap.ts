const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Use as a Svelte 5 attach (`{@attach focusTrap}` on a container).
 * Captures focus within the element, supports Escape via `onEscape`,
 * and restores focus to the previously-focused element when detached.
 */
export function focusTrap(
	options: { onEscape?: () => void; initialFocus?: HTMLElement | null } = {}
) {
	return (node: HTMLElement) => {
		const previouslyFocused = document.activeElement as HTMLElement | null;

		function getFocusable(): HTMLElement[] {
			return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
				(el) => !el.hasAttribute('inert') && el.offsetParent !== null
			);
		}

		// Put initial focus on the provided element or the first focusable child.
		queueMicrotask(() => {
			const target = options.initialFocus ?? getFocusable()[0] ?? node;
			target.focus();
		});

		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape' && options.onEscape) {
				e.preventDefault();
				options.onEscape();
				return;
			}
			if (e.key !== 'Tab') return;
			const focusable = getFocusable();
			if (focusable.length === 0) {
				e.preventDefault();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}

		node.addEventListener('keydown', onKeydown);

		return () => {
			node.removeEventListener('keydown', onKeydown);
			previouslyFocused?.focus?.();
		};
	};
}
