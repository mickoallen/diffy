<script lang="ts">
	import { repoStore } from '$lib/stores/repo.svelte';

	interface Props {
		label: string;
		value: string;
		onchange: (branch: string) => void;
	}

	let { label, value, onchange }: Props = $props();
</script>

<div class="branch-selector">
	<label class="label" for="branch-{label}">{label}</label>
	<select
		id="branch-{label}"
		class="select"
		{value}
		onchange={(e) => onchange(e.currentTarget.value)}
	>
		{#each repoStore.branches as branch}
			<option value={branch.name} selected={branch.name === value}>
				{branch.name}
				{#if branch.is_head} (HEAD){/if}
			</option>
		{/each}
	</select>
</div>

<style>
	.branch-selector {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.label {
		font-size: 12px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.select {
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 13px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		cursor: pointer;
	}
	.select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
</style>
