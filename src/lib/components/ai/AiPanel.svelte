<script lang="ts">
	import { aiStore } from '$lib/stores/ai.svelte';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';

	function getDiffText(): string {
		if (!diffStore.fileDiff) return '';
		return diffStore.fileDiff.hunks
			.flatMap((h) =>
				h.lines.map((l) => {
					const p = l.origin === 'Addition' ? '+' : l.origin === 'Deletion' ? '-' : ' ';
					return p + l.content;
				})
			)
			.join('');
	}
</script>

<aside class="ai-panel">
	<div class="panel-header">
		<h3>AI Review</h3>
		<button class="close-btn" onclick={() => (settingsStore.showAiPanel = false)}>×</button>
	</div>

	{#if !settingsStore.aiApiKey && settingsStore.aiProvider !== 'ollama' && settingsStore.aiProvider !== 'lmstudio'}
		<div class="no-key">
			<p>Configure your AI provider and API key in Settings to use AI features.</p>
		</div>
	{:else}
		<div class="actions">
			<button class="action-btn" onclick={() => aiStore.summarize(getDiffText())} disabled={aiStore.loading}>
				Summarize
			</button>
			<button class="action-btn" onclick={() => aiStore.flagIssues(getDiffText())} disabled={aiStore.loading}>
				Flag Issues
			</button>
		</div>

		{#if aiStore.loading}
			<div class="loading">Thinking...</div>
		{/if}

		{#if aiStore.error}
			<div class="error">{aiStore.error}</div>
		{/if}

		{#if aiStore.summary}
			<div class="result">
				<h4>Summary</h4>
				<div class="result-text">{aiStore.summary}</div>
			</div>
		{/if}

		{#if aiStore.issues}
			<div class="result">
				<h4>Issues</h4>
				<div class="result-text">{aiStore.issues}</div>
			</div>
		{/if}

		{#if aiStore.hunkExplanation}
			<div class="result">
				<h4>Explanation</h4>
				<div class="result-text">{aiStore.hunkExplanation}</div>
			</div>
		{/if}
	{/if}
</aside>

<style>
	.ai-panel {
		width: 320px;
		min-width: 240px;
		border-left: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary);
		overflow-y: auto;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px;
		border-bottom: 1px solid var(--border);
	}
	.panel-header h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--text-primary);
	}
	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.286rem;
		cursor: pointer;
		padding: 0 4px;
	}
	.no-key {
		padding: 16px;
		color: var(--text-muted);
		font-size: 0.929rem;
	}
	.actions {
		display: flex;
		gap: 8px;
		padding: 12px;
	}
	.action-btn {
		flex: 1;
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.857rem;
		cursor: pointer;
	}
	.action-btn:hover:not(:disabled) {
		background: var(--bg-hover);
	}
	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.loading {
		padding: 16px;
		color: var(--text-muted);
		font-style: italic;
	}
	.error {
		padding: 12px;
		margin: 8px 12px;
		color: var(--color-del);
		background: var(--diff-del-bg);
		border-radius: 6px;
		font-size: 0.857rem;
	}
	.result {
		padding: 12px;
		border-bottom: 1px solid var(--border);
	}
	.result h4 {
		margin: 0 0 8px;
		font-size: 0.857rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.result-text {
		font-size: 0.929rem;
		line-height: 1.5;
		color: var(--text-primary);
		white-space: pre-wrap;
	}
</style>
