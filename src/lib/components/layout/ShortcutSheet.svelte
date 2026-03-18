<script lang="ts">
	import { SHORTCUTS } from '$lib/utils/keyboard';
	import { settingsStore } from '$lib/stores/settings.svelte';
</script>

{#if settingsStore.showShortcuts}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={() => (settingsStore.showShortcuts = false)} onkeydown={(e) => e.key === 'Escape' && (settingsStore.showShortcuts = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="sheet" onclick={(e) => e.stopPropagation()}>
			<h3>Keyboard Shortcuts</h3>
			<div class="grid">
				{#each SHORTCUTS as shortcut}
					<div class="shortcut">
						<kbd>{shortcut.key}</kbd>
						<span>{shortcut.desc}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}
	.sheet {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 24px 32px;
		min-width: 320px;
		max-width: 420px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
	}
	h3 {
		margin: 0 0 16px;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px 24px;
	}
	.shortcut {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	kbd {
		display: inline-block;
		min-width: 24px;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 0.786rem;
		font-weight: 600;
		text-align: center;
	}
	span {
		color: var(--text-secondary);
		font-size: 0.857rem;
	}
</style>
