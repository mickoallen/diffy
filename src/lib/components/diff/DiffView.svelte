<script lang="ts">
	import { diffStore } from '$lib/stores/diff.svelte';
	import { aiStore } from '$lib/stores/ai.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import UnifiedDiff from './UnifiedDiff.svelte';
	import SplitDiff from './SplitDiff.svelte';

	function handleExplainHunk(content: string) {
		settingsStore.showAiPanel = true;
		aiStore.explainHunk(content);
	}

	let lines = $derived(diffStore.fullFileContent?.split('\n') ?? []);
</script>

<div class="diff-view">
	{#if diffStore.fileLoading}
		<div class="loading">Loading...</div>
	{:else if diffStore.treeMode === 'all' && diffStore.fullFileContent !== null && diffStore.fileDiff === null}
		<div class="full-file">
			<div class="file-header">{diffStore.selectedRepoFile}</div>
			<div class="file-content">
				{#each lines as line, i}
					<div class="line">
						<span class="lineno">{i + 1}</span>
						<span class="content">{line}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else if diffStore.fileDiff}
		{#if diffStore.viewMode === 'unified'}
			<UnifiedDiff file={diffStore.fileDiff} onExplainHunk={handleExplainHunk} />
		{:else}
			<SplitDiff file={diffStore.fileDiff} onExplainHunk={handleExplainHunk} />
		{/if}
	{:else if diffStore.error}
		<div class="error">{diffStore.error}</div>
	{:else}
		<div class="empty">Select a file to view its diff</div>
	{/if}
</div>

<style>
	.diff-view {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}
	.loading,
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		font-size: 14px;
	}
	.error {
		padding: 16px;
		color: var(--color-del);
		background: var(--diff-del-bg);
		border-radius: 6px;
		margin: 16px;
	}
	.full-file {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.file-header {
		font-size: 13px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		color: var(--text-muted);
		padding: 0 0 12px 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: 8px;
	}
	.file-content {
		flex: 1;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 13px;
	}
	.line {
		display: flex;
		gap: 12px;
		line-height: 1.5;
	}
	.lineno {
		color: var(--text-muted);
		text-align: right;
		min-width: 36px;
		user-select: none;
		flex-shrink: 0;
	}
	.content {
		white-space: pre;
		color: var(--text-primary);
	}
</style>
