<script lang="ts">
	import type { CommitInfo } from '$lib/services/git';

	interface Props {
		commits: CommitInfo[];
	}

	let { commits }: Props = $props();

	function formatTime(epoch: number): string {
		return new Date(epoch * 1000).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="commit-list">
	{#each commits as commit}
		<div class="commit">
			<span class="sha">{commit.id.slice(0, 7)}</span>
			<span class="summary">{commit.summary}</span>
			<span class="meta">{commit.author} · {formatTime(commit.time)}</span>
		</div>
	{/each}
</div>

<style>
	.commit-list {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 6px;
	}
	.commit {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 6px 12px;
		border-bottom: 1px solid var(--border);
		font-size: 0.857rem;
	}
	.commit:last-child {
		border-bottom: none;
	}
	.sha {
		font-family: 'SF Mono', 'Fira Code', monospace;
		color: var(--color-accent);
	}
	.summary {
		flex: 1;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		color: var(--text-muted);
		white-space: nowrap;
	}
</style>
