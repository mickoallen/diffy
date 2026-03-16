<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
</script>

{#if settingsStore.showSettings}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="overlay" onclick={() => (settingsStore.showSettings = false)} role="presentation">
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
			<div class="modal-header">
				<h2>Settings</h2>
				<button class="close" onclick={() => (settingsStore.showSettings = false)}>×</button>
			</div>

			<div class="setting-group">
				<span class="setting-label">Theme</span>
				<div class="toggle-row">
					<button
						class="theme-btn"
						class:active={settingsStore.theme === 'dark'}
						onclick={() => { settingsStore.theme = 'dark'; document.documentElement.setAttribute('data-theme', 'dark'); }}
					>Dark</button>
					<button
						class="theme-btn"
						class:active={settingsStore.theme === 'light'}
						onclick={() => { settingsStore.theme = 'light'; document.documentElement.setAttribute('data-theme', 'light'); }}
					>Light</button>
				</div>
			</div>

			<div class="setting-group">
				<label class="setting-label" for="api-key">Claude API Key</label>
				<input
					id="api-key"
					type="password"
					placeholder="sk-ant-..."
					bind:value={settingsStore.apiKey}
					class="input"
				/>
			</div>

			<div class="setting-group">
				<span class="setting-label">Keyboard Shortcuts</span>
				<div class="shortcuts">
					<div><kbd>j</kbd> / <kbd>k</kbd> Next / previous file</div>
					<div><kbd>s</kbd> Toggle split/unified</div>
					<div><kbd>a</kbd> Toggle AI panel</div>
					<div><kbd>f</kbd> Focus file filter</div>
					<div><kbd>Esc</kbd> Close dialogs</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}
	.modal {
		background: var(--bg-primary);
		border-radius: 12px;
		width: 460px;
		max-height: 80vh;
		overflow-y: auto;
		border: 1px solid var(--border);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border);
	}
	.modal-header h2 {
		margin: 0;
		font-size: 16px;
	}
	.close {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 20px;
		cursor: pointer;
	}
	.setting-group {
		padding: 16px 20px;
		border-bottom: 1px solid var(--border);
	}
	.setting-label {
		display: block;
		font-size: 12px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 8px;
	}
	.toggle-row {
		display: flex;
		gap: 4px;
		background: var(--bg-tertiary);
		border-radius: 6px;
		padding: 2px;
	}
	.theme-btn {
		flex: 1;
		padding: 6px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 13px;
	}
	.theme-btn.active {
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	.input {
		width: 100%;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 13px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		box-sizing: border-box;
	}
	.shortcuts {
		font-size: 13px;
		line-height: 2;
		color: var(--text-secondary);
	}
	kbd {
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-tertiary);
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 11px;
	}
</style>
