<script lang="ts">
	import { debugStore } from '$lib/stores/debug.svelte';
	import { repoStore } from '$lib/stores/repo.svelte';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';

	const state = $derived([
		['repoStore.loading', repoStore.loading],
		['repoStore.error', repoStore.error || '—'],
		['repoStore.path', repoStore.path || '—'],
		['repoStore.branches', repoStore.branches.length],
		['diffStore.loading', diffStore.loading],
		['diffStore.fileLoading', diffStore.fileLoading],
		['diffStore.error', diffStore.error || '—'],
		['diffStore.fromRef', diffStore.fromRef || '—'],
		['diffStore.toRef', diffStore.toRef || '—'],
		['settingsStore.aiProvider', settingsStore.aiProvider],
		['settingsStore.aiModel', settingsStore.aiModel],
	] as [string, unknown][]);

	function copyAll() {
		const lines = [
			'=== State ===',
			...state.map(([k, v]) => `${k}: ${v}`),
			'',
			'=== Log ===',
			...debugStore.entries.map(e => `[${e.time}] ${e.level.toUpperCase()} ${e.message}`)
		];
		navigator.clipboard.writeText(lines.join('\n'));
	}
</script>

<div class="debug-panel">
	<div class="panel-header">
		<span class="title">Debug</span>
		<div class="actions">
			<button onclick={copyAll}>Copy</button>
			<button onclick={() => debugStore.clear()}>Clear</button>
			<button class="close-btn" onclick={() => debugStore.toggle()}>×</button>
		</div>
	</div>

	<div class="panel-body">
		<div class="section">
			<div class="section-label">State</div>
			<div class="state-grid">
				{#each state as [key, value]}
					<span class="key">{key}</span>
					<span class="val" class:hot={value === true}>{String(value)}</span>
				{/each}
			</div>
		</div>

		<div class="section log-section">
			<div class="section-label">Log ({debugStore.entries.length})</div>
			{#if debugStore.entries.length === 0}
				<div class="empty">Nothing captured yet.</div>
			{:else}
				<div class="log">
					{#each debugStore.entries as entry}
						<div class="entry {entry.level}">
							<span class="time">{entry.time}</span>
							<span class="tag">{entry.level}</span>
							<span class="msg">{entry.message}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.debug-panel {
		position: fixed;
		bottom: 0;
		right: 0;
		width: 480px;
		height: 340px;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-bottom: none;
		border-right: none;
		border-radius: 10px 0 0 0;
		display: flex;
		flex-direction: column;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		z-index: 9999;
		box-shadow: -4px -4px 20px rgba(0,0,0,0.3);
		/* Only the panel itself captures pointer events */
		pointer-events: auto;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		background: var(--bg-secondary);
		border-radius: 10px 0 0 0;
	}
	.title {
		font-size: 0.786rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.actions {
		display: flex;
		gap: 4px;
	}
	.actions button {
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.714rem;
	}
	.actions button:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
	.close-btn {
		font-size: 1rem !important;
		padding: 2px 6px !important;
	}
	.panel-body {
		display: flex;
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}
	.section {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-right: 1px solid var(--border);
	}
	.section:last-child {
		border-right: none;
		flex: 1;
	}
	.section-label {
		font-size: 0.643rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
		padding: 4px 8px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		background: var(--bg-secondary);
	}
	.state-grid {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0;
		overflow-y: auto;
		padding: 4px 0;
	}
	.key, .val {
		padding: 1px 8px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.key {
		color: var(--text-muted);
	}
	.val {
		color: var(--text-secondary);
	}
	.val.hot {
		color: var(--color-mod, #fa8208);
		font-weight: 600;
	}
	.log-section {
		flex: 1;
	}
	.empty {
		padding: 8px;
		color: var(--text-muted);
		font-style: italic;
	}
	.log {
		overflow-y: auto;
		flex: 1;
		min-height: 0;
		height: 100%;
	}
	.entry {
		display: grid;
		grid-template-columns: 76px 50px 1fr;
		gap: 4px;
		padding: 2px 6px;
		border-bottom: 1px solid var(--border);
		align-items: start;
	}
	.entry:last-child { border-bottom: none; }
	.time { color: var(--text-muted); }
	.tag {
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.643rem;
		padding-top: 1px;
	}
	.entry.log .tag { color: var(--text-muted); }
	.entry.warn .tag { color: var(--color-mod, #fa8208); }
	.entry.error .tag, .entry.rejection .tag { color: var(--color-deleted, #f85149); }
	.msg {
		color: var(--text-secondary);
		word-break: break-all;
		white-space: pre-wrap;
	}
	.entry.error .msg, .entry.rejection .msg { color: var(--color-deleted, #f85149); }
</style>
