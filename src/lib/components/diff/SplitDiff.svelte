<script lang="ts">
	import type { FileDiff, DiffLine } from '$lib/services/git';
	import DiffHeader from './DiffHeader.svelte';

	interface Props {
		file: FileDiff;
		onExplainHunk?: (content: string) => void;
	}

	let { file, onExplainHunk }: Props = $props();

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

<div class="split-diff">
	<DiffHeader {file} />
	{#each file.hunks as hunk}
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
		<table class="split-table">
			<tbody>
				{#each buildSplitRows(hunk.lines) as row}
					<tr>
						<td class="line-num {bgClass(row.left, 'left')}">
							{row.left?.old_lineno ?? ''}
						</td>
						<td class="content {bgClass(row.left, 'left')}">
							{row.left?.content ?? ''}
						</td>
						<td class="divider"></td>
						<td class="line-num {bgClass(row.right, 'right')}">
							{row.right?.new_lineno ?? ''}
						</td>
						<td class="content {bgClass(row.right, 'right')}">
							{row.right?.content ?? ''}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}
</div>

<style>
	.split-diff {
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
		width: max-content;
		min-width: 100%;
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
	.split-table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
		font-family: var(--font-mono);
		font-size: 0.929rem;
		line-height: 1.5;
	}
	.line-num {
		width: 50px;
		text-align: right;
		padding: 0 8px;
		color: var(--text-muted);
		user-select: none;
		border-right: 1px solid var(--border);
	}
	.content {
		padding: 0 8px;
		white-space: pre;
		overflow-x: auto;
	}
	.divider {
		width: 2px;
		background: var(--border);
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
