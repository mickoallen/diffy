<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';

	interface Props {
		text: string | (() => string);
		label?: string;
		title?: string;
		/** What to display in the toast after a successful copy. Defaults to the aria label. */
		toastMessage?: string;
	}

	let { text, label = 'Copy', title, toastMessage }: Props = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy(event: MouseEvent) {
		event.stopPropagation();
		const value = typeof text === 'function' ? text() : text;
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1200);
			if (toastMessage) toastStore.push(toastMessage, 'info');
		} catch (e) {
			toastStore.push(`Copy failed: ${String(e)}`, 'error');
		}
	}
</script>

<button
	type="button"
	class="copy-btn"
	class:copied
	aria-label={label}
	title={title ?? label}
	onclick={copy}
>
	{#if copied}
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
			<path d="M2 6.5L5 9l5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	{:else}
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
			<rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/>
			<path d="M4 4.5V2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	{/if}
</button>

<style>
	.copy-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border-radius: 4px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.12s, color 0.12s, background 0.12s, border-color 0.12s;
	}
	:global(*:hover) > .copy-btn,
	:global(.diff-header):hover .copy-btn,
	:global(.hunk-header):hover .copy-btn,
	:global(.commit):hover .copy-btn,
	.copy-btn:focus-visible,
	.copy-btn.copied {
		opacity: 1;
	}
	.copy-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
		border-color: var(--border);
	}
	.copy-btn.copied {
		color: var(--color-add, #3fb950);
	}
</style>
