<script lang="ts">
	import { onMount } from 'svelte';
	import type { FileDiff, DiffLine } from '$lib/services/git';
	import DiffHeader from './DiffHeader.svelte';

	interface Props {
		file: FileDiff;
		onExplainHunk?: (content: string) => void;
	}

	let { file, onExplainHunk }: Props = $props();

	const VIRTUAL_THRESHOLD = 50;
	const BUFFER = 5;
	const EST_HUNK_HEIGHT = 200;

	let useVirtual = $derived(file.hunks.length > VIRTUAL_THRESHOLD);
	let visibleHunks = $state(new Set<number>());
	let containerEl = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (!useVirtual || !containerEl) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const idx = Number((entry.target as HTMLElement).dataset.hunkIdx);
					if (entry.isIntersecting) visibleHunks.add(idx);
					else visibleHunks.delete(idx);
				}
				const newVisible = new Set<number>();
				for (const idx of visibleHunks) {
					for (let b = idx - BUFFER; b <= idx + BUFFER; b++) {
						if (b >= 0 && b < file.hunks.length) newVisible.add(b);
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

	interface SplitRow {
		left: DiffLine | null;
		right: DiffLine | null;
	}

	function buildSplitRows(lines: DiffLine[]): SplitRow[] {
		const rows: SplitRow[] = [];
		const dels: DiffLine[] = [];
		const adds: DiffLine[] = [];

		function flush() {
			const max = Math.max(dels.length, adds.length);
			for (let i = 0; i < max; i++) {
				rows.push({
					left: dels[i] ?? null,
					right: adds[i] ?? null
				});
			}
			dels.length = 0;
			adds.length = 0;
		}

		for (const line of lines) {
			if (line.origin === 'Context') {
				flush();
				rows.push({ left: line, right: line });
			} else if (line.origin === 'Deletion') {
				dels.push(line);
			} else {
				adds.push(line);
			}
		}
		flush();
		return rows;
	}

	function bgClass(line: DiffLine | null, side: 'left' | 'right'): string {
		if (!line) return 'empty';
		if (line.origin === 'Addition') return 'diff-add';
		if (line.origin === 'Deletion') return 'diff-del';
		return 'diff-ctx';
	}
</script>

<div class="split-diff" bind:this={containerEl}>
	<DiffHeader {file} />
	{#if file.is_binary}
		<div class="empty binary">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="opacity:0.5">
				<rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
				<path d="M6 6h8M6 10h8M6 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			Binary file changed
		</div>
	{/if}
	{#each file.hunks as hunk, i}
		{#if useVirtual}
			<div data-hunk-idx={i} style="min-height: {visibleHunks.has(i) ? 'auto' : EST_HUNK_HEIGHT + 'px'}">
				{#if visibleHunks.has(i)}
					<div class="hunk-header">
						<span>{hunk.header.trim()}</span>
						{#if onExplainHunk}
							<button class="explain-btn" onclick={() => {
								const content = hunk.lines.map(l => {
									const p = l.origin === 'Addition' ? '+' : l.origin === 'Deletion' ? '-' : ' ';
									return p + l.content;
								}).join('');
								onExplainHunk?.(content);
							}}>Explain</button>
						{/if}
					</div>
					<div class="split-row-container">
						{#each buildSplitRows(hunk.lines) as row}
							<div class="split-row">
								<div class="half left {bgClass(row.left, 'left')}">
									<span class="line-num">{row.left?.old_lineno ?? ''}</span>
									<span class="content">{row.left?.content ?? ''}</span>
								</div>
								<div class="half right {bgClass(row.right, 'right')}">
									<span class="line-num">{row.right?.new_lineno ?? ''}</span>
									<span class="content">{row.right?.content ?? ''}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<div class="hunk-header">
				<span>{hunk.header.trim()}</span>
				{#if onExplainHunk}
					<button class="explain-btn" onclick={() => {
						const content = hunk.lines.map(l => {
							const p = l.origin === 'Addition' ? '+' : l.origin === 'Deletion' ? '-' : ' ';
							return p + l.content;
						}).join('');
						onExplainHunk?.(content);
					}}>Explain</button>
				{/if}
			</div>
			<div class="split-row-container">
				{#each buildSplitRows(hunk.lines) as row}
					<div class="split-row">
						<div class="half left {bgClass(row.left, 'left')}">
							<span class="line-num">{row.left?.old_lineno ?? ''}</span>
							<span class="content">{row.left?.content ?? ''}</span>
						</div>
						<div class="half right {bgClass(row.right, 'right')}">
							<span class="line-num">{row.right?.new_lineno ?? ''}</span>
							<span class="content">{row.right?.content ?? ''}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/each}
</div>

<style>
	.split-diff {
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
		width: 100%;
	}
	.empty.binary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 24px;
		color: var(--text-muted);
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
	.split-row {
		display: flex;
		font-family: var(--font-mono);
		font-size: 0.929rem;
		line-height: 1.5;
	}
	.half {
		display: flex;
		width: 50%;
		min-width: 0;
	}
	.half.left {
		border-right: 1px solid var(--border);
	}
	.line-num {
		flex-shrink: 0;
		width: 44px;
		text-align: right;
		padding: 0 8px;
		color: var(--text-muted);
		user-select: none;
		box-sizing: border-box;
	}
	.content {
		flex: 1;
		padding: 0 8px;
		white-space: pre;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.diff-add {
		background: var(--diff-add-bg);
	}
	.diff-del {
		background: var(--diff-del-bg);
	}
	.diff-ctx {
		background: var(--bg-primary);
	}
	.empty {
		background: var(--bg-tertiary);
	}
</style>
