<script lang="ts">
	import DiffView from '$lib/components/diff/DiffView.svelte';
	import { diffStore } from '$lib/stores/diff.svelte';
</script>

<main class="main-panel">
	<div class="toolbar">
		<div class="view-toggle">
			<button
				class="toggle-btn"
				class:active={diffStore.viewMode === 'unified'}
				onclick={() => (diffStore.viewMode = 'unified')}
			>
				Unified
			</button>
			<button
				class="toggle-btn"
				class:active={diffStore.viewMode === 'split'}
				onclick={() => (diffStore.viewMode = 'split')}
			>
				Split
			</button>
			<button
				class="toggle-btn"
				class:active={diffStore.viewMode === 'full'}
				onclick={() => (diffStore.viewMode = 'full')}
			>
				Full File
			</button>
			<span class="shortcut-hint">s</span>
		</div>
	</div>
	<DiffView />
</main>

<style>
	.main-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}
	.toolbar {
		display: flex;
		align-items: center;
		padding: 6px 12px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-secondary);
	}
	.view-toggle {
		display: flex;
		align-items: center;
		gap: 2px;
		background: var(--bg-tertiary);
		border-radius: 6px;
		padding: 2px;
	}
	.toggle-btn {
		padding: 4px 12px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.857rem;
		cursor: pointer;
	}
	.toggle-btn.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	.shortcut-hint {
		margin-left: 8px;
		font-size: 0.786rem;
		color: var(--text-muted);
		padding: 1px 4px;
		border: 1px solid var(--border);
		border-radius: 3px;
	}
</style>
