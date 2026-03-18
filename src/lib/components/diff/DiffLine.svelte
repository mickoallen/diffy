<script lang="ts">
	import type { DiffLine } from '$lib/services/git';
	import { diffStore } from '$lib/stores/diff.svelte';

	interface Props {
		line: DiffLine;
		highlighted?: string;
	}

	let { line, highlighted = '' }: Props = $props();

	let searchHighlighted = $derived.by(() => {
		const query = diffStore.searchQuery;
		if (!query) return '';
		const content = highlighted || line.content;
		const lower = content.toLowerCase();
		const qLower = query.toLowerCase();
		let idx = 0;
		let result = '';
		let pos = 0;
		while ((idx = lower.indexOf(qLower, pos)) !== -1) {
			result += content.slice(pos, idx);
			result += `<mark class="search-highlight">${content.slice(idx, idx + query.length)}</mark>`;
			pos = idx + query.length;
		}
		if (pos === 0) return '';
		result += content.slice(pos);
		return result;
	});

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
		{#if searchHighlighted}
			{@html searchHighlighted}
		{:else if highlighted}
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
