<script lang="ts">
	import { settingsStore, type Theme, type Font, type Scale } from '$lib/stores/settings.svelte';

	const themes: { value: Theme; label: string; dark: boolean }[] = [
		{ value: 'void', label: 'Void', dark: true },
		{ value: 'abyss', label: 'Abyss', dark: true },
		{ value: 'chalk', label: 'Chalk', dark: false },
		{ value: 'nate', label: 'Nate', dark: false }
	];

	const fonts: { value: Font; label: string; family: string }[] = [
		{ value: 'system', label: 'System Mono', family: "ui-monospace, 'Cascadia Code', monospace" },
		{ value: 'jetbrains', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
		{ value: 'fira', label: 'Fira Code', family: "'Fira Code', monospace" },
		{ value: 'ibm', label: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace" }
	];

	const scales: { value: Scale; label: string }[] = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'default', label: 'Default' },
		{ value: 'relaxed', label: 'Relaxed' },
		{ value: 'large', label: 'Large' }
	];
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
				<div class="grid-2x2">
					{#each themes as t}
						<button
							class="theme-btn"
							class:active={settingsStore.theme === t.value}
							class:dark={t.dark}
							onclick={() => settingsStore.setTheme(t.value)}
						>{t.label}</button>
					{/each}
				</div>
			</div>

			<div class="setting-group">
				<span class="setting-label">Font</span>
				<div class="font-grid">
					{#each fonts as f}
						<button
							class="font-btn"
							class:active={settingsStore.font === f.value}
							style="font-family: {f.family}"
							onclick={() => settingsStore.setFont(f.value)}
						>{f.label}</button>
					{/each}
				</div>
			</div>

			<div class="setting-group">
				<span class="setting-label">UI Scale</span>
				<div class="toggle-row">
					{#each scales as s}
						<button
							class="scale-btn"
							class:active={settingsStore.scale === s.value}
							onclick={() => settingsStore.setScale(s.value)}
						>{s.label}</button>
					{/each}
				</div>
			</div>

			<div class="setting-group">
				<div class="setting-label-row">
					<label class="setting-label" for="api-key">Claude API Key</label>
					<span class="coming-soon">Coming soon</span>
				</div>
				<input
					id="api-key"
					type="password"
					placeholder="sk-ant-..."
					disabled
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
		font-size: 1.143rem;
	}
	.close {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.429rem;
		cursor: pointer;
	}
	.setting-group {
		padding: 16px 20px;
		border-bottom: 1px solid var(--border);
	}
	.setting-label {
		display: block;
		font-size: 0.857rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 8px;
	}
	.grid-2x2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
	}
	.theme-btn {
		padding: 10px 8px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.929rem;
		font-weight: 500;
		transition: background 0.1s, color 0.1s, border-color 0.1s;
	}
	.theme-btn.dark {
		background: #1a1d22;
		color: #b1bac4;
		border-color: #30363d;
	}
	.theme-btn.dark.active {
		border-color: #07b9a3;
		color: #e6edf3;
	}
	.theme-btn:not(.dark) {
		background: #f6f8fa;
		color: #57606a;
		border-color: #d0d7de;
	}
	.theme-btn:not(.dark).active {
		border-color: #0969da;
		color: #1f2328;
	}
	.theme-btn.active {
		font-weight: 600;
	}
	.font-grid {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.font-btn {
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.929rem;
		text-align: left;
		transition: background 0.1s, color 0.1s, border-color 0.1s;
	}
	.font-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
	.font-btn.active {
		background: var(--bg-active);
		color: var(--text-primary);
		border-color: var(--color-accent);
	}
	.toggle-row {
		display: flex;
		gap: 4px;
		background: var(--bg-tertiary);
		border-radius: 6px;
		padding: 2px;
	}
	.scale-btn {
		flex: 1;
		padding: 6px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.929rem;
	}
	.scale-btn.active {
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	.setting-label-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.setting-label-row .setting-label {
		margin-bottom: 0;
	}
	.coming-soon {
		font-size: 0.714rem;
		font-weight: 500;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1px 7px;
		letter-spacing: 0.3px;
	}
	.input {
		width: 100%;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 0.929rem;
		font-family: var(--font-mono);
		box-sizing: border-box;
	}
	.input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.shortcuts {
		font-size: 0.929rem;
		line-height: 2;
		color: var(--text-secondary);
	}
	kbd {
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-tertiary);
		font-family: var(--font-mono);
		font-size: 0.786rem;
	}
</style>
