<script lang="ts">
	import type { DiffLine } from '$lib/services/git';

	interface Props {
		line: DiffLine;
		highlighted?: string;
	}

	let { line, highlighted = '' }: Props = $props();

	let bgClass = $derived(
		line.origin === 'Addition'
			? 'diff-add'
			: line.origin === 'Deletion'
				? 'diff-del'
				: 'diff-ctx'
	);

	let originChar = $derived(
		line.origin === 'Addition' ? '+' : line.origin === 'Deletion' ? '-' : ' '
	);
</script>

<tr class="diff-line {bgClass}">
	<td class="line-num old">{line.old_lineno ?? ''}</td>
	<td class="line-num new">{line.new_lineno ?? ''}</td>
	<td class="origin">{originChar}</td>
	<td class="content">
		{#if highlighted}
			{@html highlighted}
		{:else}
			{line.content}
		{/if}
	</td>
</tr>

<style>
	.diff-line {
		font-family: var(--font-mono);
		font-size: 0.929rem;
		line-height: 1.5;
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
	.line-num {
		color: var(--text-muted);
		text-align: right;
		padding: 0 8px;
		min-width: 40px;
		user-select: none;
		border-right: 1px solid var(--border);
	}
	.origin {
		padding: 0 4px;
		color: var(--text-muted);
		user-select: none;
	}
	.content {
		padding: 0 8px;
		white-space: pre;
	}
</style>
