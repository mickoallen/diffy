<script lang="ts">
	import type { Hunk } from '$lib/services/git';
	import DiffLine from './DiffLine.svelte';
	import CopyButton from '$lib/components/layout/CopyButton.svelte';
	import { highlightLines } from '$lib/utils/highlighter';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { diffStore } from '$lib/stores/diff.svelte';

	interface Props {
		hunk: Hunk;
		filePath: string;
		onExplain?: (hunkContent: string) => void;
	}

	let { hunk, filePath, onExplain }: Props = $props();

	let highlighted = $state<string[]>([]);

	// Stable key for this hunk within its file (header is unique per hunk in a file).
	let hunkKey = $derived(`${filePath}::${hunk.header}`);
	let collapsed = $derived(diffStore.isHunkCollapsed(hunkKey));

	let visibleLineIndices = $derived.by(() => {
		if (diffStore.foldContext) {
			return hunk.lines.map((l, i) => [l, i] as const).filter(([l]) => l.origin !== 'Context').map(([, i]) => i);
		}
		return hunk.lines.map((_, i) => i);
	});

	let changeCount = $derived(hunk.lines.filter(l => l.origin !== 'Context').length);

	$effect(() => {
		const currentHunk = hunk;
		const currentPath = filePath;
		const currentTheme = settingsStore.isDark ? 'dark' : 'light';
		highlighted = [];
		highlightLines(currentHunk.lines.map(l => l.content), currentPath, currentTheme).then(result => {
			highlighted = result;
		});
	});

	function getHunkContent(): string {
		return hunk.lines.map((l) => {
			const prefix = l.origin === 'Addition' ? '+' : l.origin === 'Deletion' ? '-' : ' ';
			return prefix + l.content;
		}).join('');
	}
</script>

<div class="hunk">
	<div class="hunk-header">
		<button
			type="button"
			class="collapse-btn"
			aria-expanded={!collapsed}
			aria-label={collapsed ? 'Expand hunk' : 'Collapse hunk'}
			onclick={() => diffStore.toggleHunkCollapsed(hunkKey)}
		>
			<svg class="chevron" class:open={!collapsed} width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
				<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<span class="hunk-range">{hunk.header.trim()}</span>
		{#if collapsed}
			<span class="hunk-summary">{changeCount} change{changeCount !== 1 ? 's' : ''}</span>
		{/if}
		<span class="hunk-actions">
			<CopyButton text={getHunkContent} label="Copy hunk" toastMessage="Hunk copied" />
			{#if onExplain}
				<button class="explain-btn" onclick={() => onExplain?.(getHunkContent())}>
					Explain
				</button>
			{/if}
		</span>
	</div>
	{#if !collapsed}
		<div class="hunk-body">
			<table class="hunk-table">
				<tbody>
					{#each visibleLineIndices as i (i)}
						<DiffLine line={hunk.lines[i]} highlighted={highlighted[i]} />
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.hunk-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px 4px 6px;
		background: var(--bg-tertiary);
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 0.857rem;
		border-bottom: 1px solid var(--border);
	}
	.collapse-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 3px;
		flex-shrink: 0;
	}
	.collapse-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
	.chevron {
		transition: transform 0.12s;
		transform: rotate(0deg);
	}
	.chevron.open {
		transform: rotate(90deg);
	}
	.hunk-range {
		flex: 1;
	}
	.hunk-summary {
		color: var(--text-muted);
		font-size: 0.786rem;
		font-style: italic;
		flex-shrink: 0;
	}
	.hunk-actions {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
	}
	.explain-btn {
		padding: 2px 8px;
		font-size: 0.786rem;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-secondary);
		cursor: pointer;
	}
	.explain-btn:hover {
		background: var(--bg-hover);
	}
	.hunk-body {
		overflow-x: auto;
	}
	.hunk-table {
		width: max-content;
		min-width: 100%;
		border-collapse: collapse;
	}
</style>
