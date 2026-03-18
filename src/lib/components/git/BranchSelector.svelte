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
	let filterInputEl = $state<HTMLInputElement | null>(null);
	let filter = $state('');
	let highlightedIndex = $state(-1);

	const localBranches = $derived(repoStore.branches.filter(b => !b.is_remote));
	const remoteBranches = $derived(repoStore.branches.filter(b => b.is_remote));

	const filteredLocal = $derived(
		localBranches.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()))
	);
	const filteredRemote = $derived(
		remoteBranches.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()))
	);
	const allFiltered = $derived([...filteredLocal, ...filteredRemote]);

	$effect(() => {
		if (open) {
			filter = '';
			highlightedIndex = -1;
			// Focus filter input after DOM update
			setTimeout(() => filterInputEl?.focus(), 0);
		}
	});

	function select(name: string) {
		open = false;
		onchange(name);
	}

	function handleMenuKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedIndex = (highlightedIndex + 1) % allFiltered.length;
			scrollHighlightedIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedIndex = highlightedIndex <= 0 ? allFiltered.length - 1 : highlightedIndex - 1;
			scrollHighlightedIntoView();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedIndex >= 0 && highlightedIndex < allFiltered.length) {
				select(allFiltered[highlightedIndex].name);
			}
		}
	}

	function scrollHighlightedIntoView() {
		setTimeout(() => {
			const el = document.querySelector('.branch-menu .item.highlighted');
			el?.scrollIntoView({ block: 'nearest' });
		}, 0);
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
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="menu branch-menu" onkeydown={handleMenuKeydown}>
				<div class="filter-row">
					<input
						bind:this={filterInputEl}
						type="text"
						class="branch-filter"
						placeholder="Filter branches..."
						bind:value={filter}
					/>
				</div>
				{#if filteredLocal.length > 0}
					<div class="group-label">Local</div>
					{#each filteredLocal as branch, i}
						<button
							class="item"
							class:active={branch.name === value}
							class:highlighted={highlightedIndex === i}
							onclick={() => select(branch.name)}
							type="button"
						>
							{branch.name}{branch.is_head ? ' ✦' : ''}
						</button>
					{/each}
				{/if}
				{#if filteredRemote.length > 0}
					{#if filteredLocal.length > 0}<div class="divider"></div>{/if}
					<div class="group-label">Remote</div>
					{#each filteredRemote as branch, i}
						<button
							class="item"
							class:active={branch.name === value}
							class:highlighted={highlightedIndex === filteredLocal.length + i}
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
	.item.highlighted {
		background: var(--bg-hover);
	}
	.filter-row {
		padding: 4px;
		border-bottom: 1px solid var(--border);
	}
	.branch-filter {
		width: 100%;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.857rem;
		box-sizing: border-box;
	}
	.branch-filter:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
</style>
