<script lang="ts">
	import { SHORTCUTS } from '$lib/utils/keyboard';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { focusTrap } from '$lib/utils/focusTrap';

	function close() {
		settingsStore.showShortcuts = false;
	}
</script>

{#if settingsStore.showShortcuts}
	<div
		class="backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		role="presentation"
	>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-labelledby="shortcuts-title"
			tabindex="-1"
			{@attach focusTrap({ onEscape: close })}
		>
			<h3 id="shortcuts-title">Keyboard Shortcuts</h3>
			<button type="button" class="close" aria-label="Close" onclick={close}>×</button>
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
		position: relative;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 24px 32px;
		min-width: 320px;
		max-width: 420px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
	}
	.close {
		position: absolute;
		top: 8px;
		right: 10px;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
	}
	.close:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
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
