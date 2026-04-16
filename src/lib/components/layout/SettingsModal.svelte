<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore, type Theme, type Font, type Scale, type AiProvider } from '$lib/stores/settings.svelte';
	import { listAiModels, testAiConnection } from '$lib/services/ai';
	import { focusTrap } from '$lib/utils/focusTrap';

	function closeModal() {
		settingsStore.showSettings = false;
	}

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

	const providers: { value: AiProvider; label: string }[] = [
		{ value: 'claude', label: 'Claude' },
		{ value: 'openai', label: 'OpenAI' },
		{ value: 'gemini', label: 'Gemini' },
		{ value: 'ollama', label: 'Ollama' },
		{ value: 'lmstudio', label: 'LM Studio' }
	];

	let models = $state<string[]>([]);
	let modelsLoading = $state(false);
	let modelsError = $state('');
	let testStatus = $state<'idle' | 'testing' | 'ok' | 'error'>('idle');
	let testError = $state('');

	const LOCAL_PROVIDERS = new Set(['ollama', 'lmstudio']);
	const NO_KEY_PROVIDERS = new Set(['ollama']);

	async function loadModels() {
		modelsLoading = true;
		modelsError = '';
		try {
			models = await listAiModels(settingsStore.aiProvider, settingsStore.aiApiKey, settingsStore.aiBaseUrl);
			if (models.length > 0 && !settingsStore.aiModel) {
				settingsStore.aiModel = models[0];
				settingsStore.save();
			}
		} catch (e) {
			modelsError = String(e);
			models = [];
		} finally {
			modelsLoading = false;
		}
	}

	function onProviderChange(p: AiProvider) {
		settingsStore.aiProvider = p;
		settingsStore.aiModel = '';
		if (p === 'ollama') settingsStore.aiBaseUrl = 'http://localhost:11434';
		else if (p === 'lmstudio') settingsStore.aiBaseUrl = 'http://localhost:1234';
		settingsStore.save();
		testStatus = 'idle';
		loadModels();
	}

	function saveAiSettings() {
		settingsStore.save();
		testStatus = 'idle';
	}

	async function testConnection() {
		testStatus = 'testing';
		testError = '';
		try {
			await testAiConnection({
				provider: settingsStore.aiProvider,
				apiKey: settingsStore.aiApiKey,
				model: settingsStore.aiModel,
				baseUrl: settingsStore.aiBaseUrl
			});
			testStatus = 'ok';
		} catch (e) {
			testStatus = 'error';
			testError = String(e);
		}
	}

	onMount(() => {
		loadModels();
	});
</script>

<div
	class="overlay"
	onclick={(e) => {
		if (e.target === e.currentTarget) closeModal();
	}}
	role="presentation"
>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-title"
			tabindex="-1"
			{@attach focusTrap({ onEscape: closeModal })}
		>
			<div class="modal-header">
				<h2 id="settings-title">Settings</h2>
				<button class="close" aria-label="Close settings" onclick={closeModal}>×</button>
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
				<span class="setting-label">AI Provider</span>
				<div class="toggle-row">
					{#each providers as p}
						<button
							class="scale-btn"
							class:active={settingsStore.aiProvider === p.value}
							onclick={() => onProviderChange(p.value)}
						>{p.label}</button>
					{/each}
				</div>

				{#if LOCAL_PROVIDERS.has(settingsStore.aiProvider)}
					<div class="field-row">
						<label class="field-label" for="base-url">Base URL</label>
						<input
							id="base-url"
							type="text"
							class="input"
							bind:value={settingsStore.aiBaseUrl}
							onchange={saveAiSettings}
								/>
					</div>
				{/if}

				{#if !NO_KEY_PROVIDERS.has(settingsStore.aiProvider)}
					<div class="field-row">
						<label class="field-label" for="api-key">API Key</label>
						<input
							id="api-key"
							type="password"
							class="input"
							placeholder={settingsStore.aiProvider === 'claude' ? 'sk-ant-...' : settingsStore.aiProvider === 'openai' ? 'sk-...' : 'API key'}
							bind:value={settingsStore.aiApiKey}
							onchange={saveAiSettings}
								/>
					</div>
				{/if}

				<div class="field-row">
					<label class="field-label" for="ai-model">Model</label>
					{#if modelsLoading}
						<div class="input input-placeholder">Loading models…</div>
					{:else if modelsError}
						<div class="input input-error" title={modelsError}>Could not load models</div>
					{:else}
						<input
							id="ai-model"
							type="text"
							class="input"
							list="ai-model-list"
							bind:value={settingsStore.aiModel}
							onchange={saveAiSettings}
								placeholder="e.g. claude-sonnet-4-6"
						/>
						<datalist id="ai-model-list">
							{#each models as m}
								<option value={m}></option>
							{/each}
						</datalist>
					{/if}
				</div>

				<div class="ai-actions">
					<button class="action-btn save-btn" onclick={saveAiSettings}>Save</button>
					<button
						class="action-btn test-btn"
						onclick={testConnection}
						disabled={testStatus === 'testing'}
					>
						{testStatus === 'testing' ? 'Testing…' : 'Test Connection'}
					</button>
					{#if testStatus === 'ok'}
						<span class="test-ok">✓ Connected</span>
					{:else if testStatus === 'error'}
						<span class="test-err" title={testError}>Failed</span>
					{/if}
				</div>
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
	.field-row {
		margin-top: 10px;
	}
	.field-label {
		display: block;
		font-size: 0.786rem;
		color: var(--text-muted);
		margin-bottom: 4px;
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
	.input-placeholder {
		color: var(--text-muted);
		font-style: italic;
	}
	.input-error {
		color: var(--color-deleted, #f85149);
		cursor: help;
	}
	.ai-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
	}
	.action-btn {
		padding: 6px 14px;
		border-radius: 6px;
		border: 1px solid var(--border);
		cursor: pointer;
		font-size: 0.857rem;
		font-family: var(--font-mono);
	}
	.save-btn {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	.save-btn:hover {
		background: var(--bg-hover);
	}
	.test-btn {
		background: var(--color-accent, #07b9a3);
		color: #fff;
		border-color: transparent;
	}
	.test-btn:hover:not(:disabled) {
		opacity: 0.85;
	}
	.test-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.test-ok {
		font-size: 0.857rem;
		color: var(--color-added, #3fb950);
	}
	.test-err {
		font-size: 0.857rem;
		color: var(--color-deleted, #f85149);
		cursor: help;
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
