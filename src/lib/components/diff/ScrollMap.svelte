<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { DiffLine } from '$lib/services/git';

	interface Props {
		lines: DiffLine[];
		scrollEl: HTMLElement | null;
	}

	let { lines, scrollEl }: Props = $props();

	let mapEl = $state<HTMLElement | null>(null);
	let rect = $state<DOMRect | null>(null);
	let scrollTop = $state(0);
	let scrollHeight = $state(1);
	let clientHeight = $state(1);

	function updateRect() {
		if (scrollEl) {
			rect = scrollEl.getBoundingClientRect();
			scrollTop = scrollEl.scrollTop;
			scrollHeight = scrollEl.scrollHeight;
			clientHeight = scrollEl.clientHeight;
		}
	}

	function onScroll() {
		if (scrollEl) {
			scrollTop = scrollEl.scrollTop;
			scrollHeight = scrollEl.scrollHeight;
			clientHeight = scrollEl.clientHeight;
		}
	}

	function clickTick(lineIndex: number) {
		if (!scrollEl) return;
		const ratio = lineIndex / lines.length;
		scrollEl.scrollTop = ratio * scrollEl.scrollHeight;
	}

	let resizeObserver: ResizeObserver | null = null;

	$effect(() => {
		// Clean up previous
		resizeObserver?.disconnect();
		scrollEl?.removeEventListener('scroll', onScroll);

		if (!scrollEl) {
			rect = null;
			return;
		}

		updateRect();
		scrollEl.addEventListener('scroll', onScroll, { passive: true });

		resizeObserver = new ResizeObserver(updateRect);
		resizeObserver.observe(scrollEl);

		return () => {
			resizeObserver?.disconnect();
			scrollEl?.removeEventListener('scroll', onScroll);
		};
	});

	// Also update rect on window resize / scroll
	onMount(() => {
		window.addEventListener('resize', updateRect);
		return () => window.removeEventListener('resize', updateRect);
	});

	let changedLines = $derived(
		lines.map((line, i) => ({ line, i })).filter(
			({ line }) => line.origin === 'Addition' || line.origin === 'Deletion'
		)
	);

	let viewportHeight = $derived(scrollHeight > 0 ? (clientHeight / scrollHeight) * 100 : 0);
	let viewportTop = $derived(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
</script>

{#if rect && lines.length > 0}
	<div
		bind:this={mapEl}
		class="scroll-map"
		style:top="{rect.top}px"
		style:left="{rect.right - 8}px"
		style:height="{rect.height}px"
	>
		<!-- Viewport indicator -->
		<div
			class="viewport-indicator"
			style:top="{viewportTop}%"
			style:height="{viewportHeight}%"
		></div>

		<!-- Change ticks -->
		{#each changedLines as { line, i }}
			<button
				class="tick {line.origin === 'Addition' ? 'add' : 'del'}"
				style:top="{(i / lines.length) * 100}%"
				onclick={() => clickTick(i)}
				aria-label="Jump to {line.origin.toLowerCase()} at line {i + 1}"
			></button>
		{/each}
	</div>
{/if}

<style>
	.scroll-map {
		position: fixed;
		width: 8px;
		z-index: 10;
		pointer-events: none;
		overflow: hidden;
	}

	.viewport-indicator {
		position: absolute;
		left: 0;
		width: 100%;
		background: var(--text-muted);
		opacity: 0.2;
		border-radius: 2px;
		min-height: 4px;
	}

	.tick {
		position: absolute;
		left: 0;
		width: 100%;
		height: 2px;
		border: none;
		padding: 0;
		cursor: pointer;
		pointer-events: all;
		border-radius: 1px;
	}

	.tick.add {
		background: var(--color-add);
		opacity: 0.7;
	}

	.tick.del {
		background: var(--color-del);
		opacity: 0.7;
	}
</style>
