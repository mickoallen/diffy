<script lang="ts">
	import type { FileDiff } from '$lib/services/git';
	import { getFileContent } from '$lib/services/git';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { repoStore } from '$lib/stores/repo.svelte';
	import DiffHeader from './DiffHeader.svelte';
	import DiffHunk from './DiffHunk.svelte';
	import ExpandContext from './ExpandContext.svelte';

	interface Props {
		file: FileDiff;
		onExplainHunk?: (content: string) => void;
	}

	let { file, onExplainHunk }: Props = $props();

	// Lazily-fetched full file lines for expand-context
	let fileLines = $state<string[] | null>(null);
	let fileLoading = $state(false);

	async function ensureFileLoaded() {
		if (fileLines !== null || fileLoading) return;
		const ref = diffStore.toRef || 'HEAD';
		fileLoading = true;
		try {
			fileLines = await getFileContent(repoStore.path, ref, file.path);
		} catch {
			fileLines = [];
		} finally {
			fileLoading = false;
		}
	}

	// Compute gaps between hunks.
	// A gap is the range of new-file lines between the end of hunk[i] and start of hunk[i+1].
	interface Gap {
		gapStart: number;
		gapEnd: number;
	}

	function computeGaps(): Gap[] {
		const gaps: Gap[] = [];
		for (let i = 0; i < file.hunks.length - 1; i++) {
			const curr = file.hunks[i];
			const next = file.hunks[i + 1];
			// End of current hunk (last new-file line)
			const currEnd = curr.new_start + curr.new_lines - 1;
			// Start of next hunk
			const nextStart = next.new_start;
			if (nextStart > currEnd + 1) {
				gaps.push({ gapStart: currEnd + 1, gapEnd: nextStart - 1 });
			}
		}
		return gaps;
	}
</script>

<div class="unified-diff">
	<DiffHeader {file} />
	{#if file.hunks.length === 0}
		<div class="empty">No changes in this file</div>
	{:else}
		{@const gaps = computeGaps()}
		{#each file.hunks as hunk, i}
			<DiffHunk {hunk} filePath={file.path} onExplain={onExplainHunk} />
			{#if i < file.hunks.length - 1 && gaps[i] && gaps[i].gapEnd >= gaps[i].gapStart}
				<ExpandContext
					gapStart={gaps[i].gapStart}
					gapEnd={gaps[i].gapEnd}
					{fileLines}
					filePath={file.path}
					loading={fileLoading}
					onExpand={ensureFileLoaded}
				/>
			{/if}
		{/each}
	{/if}
</div>

<style>
	.unified-diff {
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
		width: 100%;
	}
	.empty {
		padding: 24px;
		text-align: center;
		color: var(--text-muted);
	}
</style>
