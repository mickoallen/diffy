<script lang="ts">
	import type { FileDiff } from '$lib/services/git';
	import DiffHeader from './DiffHeader.svelte';
	import DiffHunk from './DiffHunk.svelte';

	interface Props {
		file: FileDiff;
		onExplainHunk?: (content: string) => void;
	}

	let { file, onExplainHunk }: Props = $props();
</script>

<div class="unified-diff">
	<DiffHeader {file} />
	{#each file.hunks as hunk}
		<DiffHunk {hunk} filePath={file.path} onExplain={onExplainHunk} />
	{/each}
	{#if file.hunks.length === 0}
		<div class="empty">No changes in this file</div>
	{/if}
</div>

<style>
	.unified-diff {
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
	}
	.empty {
		padding: 24px;
		text-align: center;
		color: var(--text-muted);
	}
</style>
