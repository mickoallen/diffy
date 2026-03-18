<script lang="ts">
	import { diffStore } from '$lib/stores/diff.svelte';

	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (diffStore.searchOpen) {
			setTimeout(() => inputEl?.focus(), 0);
		}
	});

	// Count matches whenever query or fileDiff changes
	$effect(() => {
		const query = diffStore.searchQuery.toLowerCase();
		if (!query || !diffStore.fileDiff) {
			diffStore.searchMatchCount = 0;
			diffStore.currentMatchIndex = 0;
			return;
		}
		let count = 0;
		for (const hunk of diffStore.fileDiff.hunks) {
			for (const line of hunk.lines) {
				let idx = 0;
				const lower = line.content.toLowerCase();
				while ((idx = lower.indexOf(query, idx)) !== -1) {
					count++;
					idx += query.length;
				}
			}
		}
		diffStore.searchMatchCount = count;
		diffStore.currentMatchIndex = 0;
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			diffStore.closeSearch();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (e.shiftKey) {
				diffStore.prevMatch();
			} else {
				diffStore.nextMatch();
			}
		}
	}
</script>

{#if diffStore.searchOpen}
	<div class="search-bar">
		<input
			bind:this={inputEl}
			type="text"
			class="search-input"
			placeholder="Search in diff..."
			bind:value={diffStore.searchQuery}
			onkeydown={handleKeydown}
		/>
		<span class="match-count">
			{#if diffStore.searchQuery && diffStore.searchMatchCount > 0}
				{diffStore.currentMatchIndex + 1}/{diffStore.searchMatchCount}
			{:else if diffStore.searchQuery}
				0 results
			{/if}
		</span>
		<button class="nav-btn" onclick={() => diffStore.prevMatch()} title="Previous (Shift+Enter)">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<button class="nav-btn" onclick={() => diffStore.nextMatch()} title="Next (Enter)">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<button class="nav-btn close" onclick={() => diffStore.closeSearch()} title="Close (Esc)">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>
	</div>
{/if}

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		margin-bottom: 12px;
	}
	.search-input {
		flex: 1;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.857rem;
		font-family: var(--font-mono);
	}
	.search-input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	.match-count {
		font-size: 0.786rem;
		color: var(--text-muted);
		white-space: nowrap;
		min-width: 48px;
		text-align: center;
	}
	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 4px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
	}
	.nav-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
</style>
