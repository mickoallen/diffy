<script lang="ts">
	import type { FileDiff } from '$lib/services/git';
	import CopyButton from '$lib/components/layout/CopyButton.svelte';

	interface Props {
		file: FileDiff;
	}

	let { file }: Props = $props();

	let statusBadge = $derived(
		file.status === 'Added'
			? 'A'
			: file.status === 'Deleted'
				? 'D'
				: file.status === 'Renamed'
					? 'R'
					: 'M'
	);

	let statusClass = $derived(file.status.toLowerCase());
</script>

<div class="diff-header">
	<span class="status-badge {statusClass}">{statusBadge}</span>
	<span class="file-path">
		{#if file.old_path}
			{file.old_path} → {file.path}
		{:else}
			{file.path}
		{/if}
	</span>
	<CopyButton text={file.path} label="Copy file path" toastMessage="Path copied" />
	<span class="stats">
		{#if file.additions > 0}
			<span class="additions">+{file.additions}</span>
		{/if}
		{#if file.deletions > 0}
			<span class="deletions">-{file.deletions}</span>
		{/if}
	</span>
</div>

<style>
	.diff-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.929rem;
	}
	.status-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 4px;
		font-size: 0.786rem;
		font-weight: 600;
	}
	.added {
		background: var(--diff-add-badge);
		color: white;
	}
	.deleted {
		background: var(--diff-del-badge);
		color: white;
	}
	.modified {
		background: var(--diff-mod-badge);
		color: white;
	}
	.renamed {
		background: var(--diff-rename-badge);
		color: white;
	}
	.file-path {
		flex: 1;
		color: var(--text-primary);
	}
	.additions {
		color: var(--color-add);
	}
	.deletions {
		color: var(--color-del);
		margin-left: 8px;
	}
</style>
