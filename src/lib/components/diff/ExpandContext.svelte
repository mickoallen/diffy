<script lang="ts">
	/**
	 * Renders expand-context rows between/before/after hunks.
	 *
	 * Props:
	 *   gapStart  — first 1-based new-file line number in the gap (inclusive)
	 *   gapEnd    — last  1-based new-file line number in the gap (inclusive)
	 *   fileLines — all lines of the new file (index 0 = line 1), or null while loading
	 *   loading   — true while fetching file content
	 *   onExpand  — called when user first clicks expand (triggers lazy load)
	 */
	const EXPAND_AMOUNT = 10;

	interface Props {
		gapStart: number;
		gapEnd: number;
		fileLines: string[] | null;
		loading?: boolean;
		onExpand: () => void;
	}

	let { gapStart, gapEnd, fileLines, loading = false, onExpand }: Props = $props();

	let expandedTop = $state(0);
	let expandedBottom = $state(0);

	// Reset expanded lines whenever the gap boundaries change
	$effect(() => {
		// Reading gapStart/gapEnd here subscribes this effect to their changes
		gapStart; gapEnd; // eslint-disable-line no-unused-expressions
		expandedTop = 0;
		expandedBottom = 0;
	});

	let gapSize = $derived(Math.max(0, gapEnd - gapStart + 1));
	let totalExpanded = $derived(expandedTop + expandedBottom);
	let remaining = $derived(gapSize - totalExpanded);

	let topLines = $derived(
		fileLines ? fileLines.slice(gapStart - 1, gapStart - 1 + expandedTop) : []
	);

	let bottomOffset = $derived(gapStart + expandedTop + remaining);
	let bottomLines = $derived(
		fileLines ? fileLines.slice(bottomOffset - 1, bottomOffset - 1 + expandedBottom) : []
	);

	function handleExpandTop() {
		if (fileLines === null) { onExpand(); return; }
		expandedTop += Math.min(EXPAND_AMOUNT, remaining);
	}

	function handleExpandBottom() {
		if (fileLines === null) { onExpand(); return; }
		expandedBottom += Math.min(EXPAND_AMOUNT, remaining);
	}

	function handleExpandAll() {
		if (fileLines === null) { onExpand(); return; }
		expandedTop = gapSize;
		expandedBottom = 0;
	}
</script>

<div class="expand-context">
	{#each topLines as lineContent, i}
		<div class="ctx-line">
			<span class="lineno">{gapStart + i}</span>
			<span class="origin"> </span>
			<span class="content">{lineContent}</span>
		</div>
	{/each}

	{#if remaining > 0}
		<div class="expand-bar">
			{#if loading}
				<span class="gap-info">Loading…</span>
			{:else if remaining <= EXPAND_AMOUNT || gapSize <= EXPAND_AMOUNT}
				<button class="expand-btn" onclick={handleExpandAll}>
					↕ Expand all {remaining} line{remaining === 1 ? '' : 's'}
				</button>
			{:else}
				<button class="expand-btn" onclick={handleExpandTop}>↑ Expand {EXPAND_AMOUNT}</button>
				<span class="gap-info">··· {remaining} hidden line{remaining === 1 ? '' : 's'} ···</span>
				<button class="expand-btn" onclick={handleExpandBottom}>↓ Expand {EXPAND_AMOUNT}</button>
			{/if}
		</div>
	{/if}

	{#each bottomLines as lineContent, i}
		<div class="ctx-line">
			<span class="lineno">{bottomOffset + i}</span>
			<span class="origin"> </span>
			<span class="content">{lineContent}</span>
		</div>
	{/each}
</div>

<style>
	.expand-context {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 13px;
	}
	.ctx-line {
		display: flex;
		background: var(--bg-primary);
		line-height: 1.5;
	}
	.ctx-line .lineno {
		min-width: 48px;
		text-align: right;
		padding: 0 8px;
		color: var(--text-muted);
		user-select: none;
		border-right: 1px solid var(--border);
		flex-shrink: 0;
	}
	.ctx-line .origin {
		width: 20px;
		text-align: center;
		flex-shrink: 0;
		padding: 0 4px;
	}
	.ctx-line .content {
		white-space: pre;
		color: var(--text-secondary);
		padding: 0 4px;
	}
	.expand-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 3px 0;
		background: var(--bg-tertiary);
		border-top: 1px dashed var(--border);
		border-bottom: 1px dashed var(--border);
	}
	.expand-btn {
		padding: 2px 10px;
		font-size: 11px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		cursor: pointer;
	}
	.expand-btn:hover {
		background: var(--bg-hover);
	}
	.gap-info {
		font-size: 11px;
		color: var(--text-muted);
	}
</style>
