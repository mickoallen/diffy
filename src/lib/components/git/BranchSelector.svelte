<script lang="ts">
	import { repoStore } from '$lib/stores/repo.svelte';

	interface Props {
		label: string;
		value: string;
		onchange: (branch: string) => void;
	}

	let { label, value, onchange }: Props = $props();

	let open = $state(false);
	let buttonEl = $state<HTMLButtonElement | null>(null);

	const localBranches = $derived(repoStore.branches.filter(b => !b.is_remote));
	const remoteBranches = $derived(repoStore.branches.filter(b => b.is_remote));

	function select(name: string) {
		open = false;
		onchange(name);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	function onwindowclick(e: MouseEvent) {
		if (open && buttonEl && !buttonEl.closest('.branch-selector')?.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={onwindowclick} onkeydown={onkeydown} />

<div class="branch-selector">
	<span class="label">{label}</span>
	<div class="dropdown">
		<button
			bind:this={buttonEl}
			class="trigger"
			class:open
			onclick={() => (open = !open)}
			type="button"
		>
			<span class="trigger-text">{value || '—'}</span>
			<svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>

		{#if open}
			<div class="menu">
				{#if localBranches.length > 0}
					<div class="group-label">Local</div>
					{#each localBranches as branch}
						<button
							class="item"
							class:active={branch.name === value}
							onclick={() => select(branch.name)}
							type="button"
						>
							{branch.name}{branch.is_head ? ' ✦' : ''}
						</button>
					{/each}
				{/if}
				{#if remoteBranches.length > 0}
					{#if localBranches.length > 0}<div class="divider"></div>{/if}
					<div class="group-label">Remote</div>
					{#each remoteBranches as branch}
						<button
							class="item"
							class:active={branch.name === value}
							onclick={() => select(branch.name)}
							type="button"
						>
							{branch.name}{branch.is_default ? ' ★' : ''}
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.branch-selector {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.label {
		font-size: 0.857rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.dropdown {
		position: relative;
	}
	.trigger {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 0.929rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		cursor: pointer;
		white-space: nowrap;
		transition: border-color 0.15s, background 0.15s;
	}
	.trigger:hover,
	.trigger.open {
		border-color: var(--color-accent);
		background: var(--bg-tertiary);
	}
	.trigger-text {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.chevron {
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.trigger.open .chevron {
		transform: rotate(180deg);
	}
	.menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 180px;
		max-height: 320px;
		overflow-y: auto;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 100;
		padding: 4px;
	}
	.group-label {
		padding: 4px 10px 2px;
		font-size: 0.786rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.divider {
		height: 1px;
		background: var(--border);
		margin: 4px 0;
	}
	.item {
		display: block;
		width: 100%;
		padding: 6px 10px;
		border: none;
		border-radius: 5px;
		background: none;
		color: var(--text-primary);
		font-size: 0.929rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		text-align: left;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: background 0.1s;
	}
	.item:hover {
		background: var(--bg-hover);
	}
	.item.active {
		background: var(--bg-active);
		color: var(--color-accent);
	}
</style>
