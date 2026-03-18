<script lang="ts">
	import { onMount } from 'svelte';
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

	// Virtual scrolling: only render hunks near the viewport for large diffs
	const VIRTUAL_THRESHOLD = 50; // hunk count to enable virtualization
	const BUFFER = 5; // hunks above/below viewport to keep rendered
	const EST_HUNK_HEIGHT = 200; // px estimate per hunk

	let useVirtual = $derived(file.hunks.length > VIRTUAL_THRESHOLD);
	let visibleHunks = $state(new Set<number>());
	let containerEl = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (!useVirtual || !containerEl) return;

		// Initialize: mark all hunks as not visible
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const idx = Number((entry.target as HTMLElement).dataset.hunkIdx);
					if (entry.isIntersecting) {
						visibleHunks.add(idx);
					} else {
						visibleHunks.delete(idx);
					}
				}
				// Expand visible set with buffer
				const newVisible = new Set<number>();
				for (const idx of visibleHunks) {
					for (let b = idx - BUFFER; b <= idx + BUFFER; b++) {
						if (b >= 0 && b < file.hunks.length) {
							newVisible.add(b);
						}
					}
				}
				visibleHunks = newVisible;
			},
			{ root: containerEl.closest('.diff-view'), rootMargin: '200px' }
		);

		const placeholders = containerEl.querySelectorAll('[data-hunk-idx]');
		placeholders.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});

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

<div class="unified-diff" bind:this={containerEl}>
	<DiffHeader {file} />
	{#if file.is_binary}
		<div class="empty binary">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="opacity:0.5">
				<rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
				<path d="M6 6h8M6 10h8M6 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			Binary file changed
		</div>
	{:else if file.hunks.length === 0}
		<div class="empty">No changes in this file</div>
	{:else}
		{@const gaps = computeGaps()}
		{#each file.hunks as hunk, i}
			{#if useVirtual}
				<div data-hunk-idx={i} style="min-height: {visibleHunks.has(i) ? 'auto' : EST_HUNK_HEIGHT + 'px'}">
					{#if visibleHunks.has(i)}
						<DiffHunk {hunk} filePath={file.path} onExplain={onExplainHunk} />
					{/if}
				</div>
			{:else}
				<DiffHunk {hunk} filePath={file.path} onExplain={onExplainHunk} />
			{/if}
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
	.empty.binary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
</style>
