<script lang="ts">
	import type { Hunk } from '$lib/services/git';
	import DiffLine from './DiffLine.svelte';
	import { highlightLine } from '$lib/utils/highlighter';
	import { settingsStore } from '$lib/stores/settings.svelte';

	interface Props {
		hunk: Hunk;
		filePath: string;
		onExplain?: (hunkContent: string) => void;
	}

	let { hunk, filePath, onExplain }: Props = $props();

	let highlighted = $state<Record<number, string>>({});

	$effect(() => {
		const currentHunk = hunk;
		const currentPath = filePath;
		const currentTheme = settingsStore.isDark ? 'dark' : 'light';
		highlighted = {};
		currentHunk.lines.forEach((line, i) => {
			highlightLine(line.content, currentPath, currentTheme).then((html) => {
				highlighted[i] = html;
			});
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
		<span class="hunk-range">{hunk.header.trim()}</span>
		{#if onExplain}
			<button class="explain-btn" onclick={() => onExplain?.(getHunkContent())}>
				Explain
			</button>
		{/if}
	</div>
	<table class="hunk-table">
		<tbody>
			{#each hunk.lines as line, i}
				<DiffLine {line} highlighted={highlighted[i]} />
			{/each}
		</tbody>
	</table>
</div>

<style>
	.hunk {
		border-bottom: 1px solid var(--border);
	}
	.hunk-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 12px;
		background: var(--bg-tertiary);
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 0.857rem;
		border-bottom: 1px solid var(--border);
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
	.hunk-table {
		width: max-content;
		min-width: 100%;
		border-collapse: collapse;
	}
</style>
