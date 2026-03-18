<script lang="ts">
	import { diffStore } from '$lib/stores/diff.svelte';
	import { repoStore } from '$lib/stores/repo.svelte';
	import { aiStore } from '$lib/stores/ai.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { readRepoFile } from '$lib/services/git';
	import UnifiedDiff from './UnifiedDiff.svelte';
	import SplitDiff from './SplitDiff.svelte';
	import FullFileDiff from './FullFileDiff.svelte';
	import SearchBar from './SearchBar.svelte';
	import { marked } from 'marked';
	import { convertFileSrc } from '@tauri-apps/api/core';

	function handleExplainHunk(content: string) {
		settingsStore.showAiPanel = true;
		aiStore.explainHunk(content);
	}

	let lines = $derived(diffStore.fullFileContent?.split('\n') ?? []);

	let showMarkdown = $state(false);
	let mdContent = $state<string | null>(null);

	let currentFilePath = $derived(
		diffStore.treeMode === 'all'
			? diffStore.selectedRepoFile
			: diffStore.fileDiff?.path ?? null
	);

	let isMdFile = $derived(currentFilePath?.endsWith('.md') ?? false);

	$effect(() => {
		// Reset when file changes
		currentFilePath;
		showMarkdown = false;
		mdContent = null;
	});

	async function enableMarkdown() {
		showMarkdown = true;
		if (mdContent !== null) return;

		let raw: string | null = null;
		if (diffStore.treeMode === 'all' && diffStore.fullFileContent !== null) {
			raw = diffStore.fullFileContent;
		} else if (currentFilePath) {
			raw = await readRepoFile(repoStore.path, currentFilePath);
		}

		if (raw !== null) {
			// Parse markdown then rewrite relative image src attrs to asset:// URLs
			const parts = currentFilePath ? currentFilePath.split('/').slice(0, -1) : [];
			const fileDir = parts.length > 0
				? repoStore.path + '/' + parts.join('/')
				: repoStore.path;

			let html = await marked.parse(raw);

			// Replace src="..." for relative image paths
			html = html.replace(/(<img[^>]+src=")([^"]+)(")/g, (_match, pre, src, post) => {
				if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('asset://')) {
					return pre + src + post;
				}
				const absPath = src.startsWith('/') ? src : fileDir + '/' + src;
				return pre + convertFileSrc(absPath) + post;
			});

			mdContent = html;
		}
	}
</script>

<div class="diff-view">
	<SearchBar />
	{#if diffStore.fileLoading}
		<div class="loading">Loading...</div>
	{:else if diffStore.treeMode === 'all' && diffStore.fullFileContent !== null && diffStore.fileDiff === null}
		<div class="full-file">
			<div class="file-header">
				<span>{diffStore.selectedRepoFile}</span>
				{#if isMdFile}
					<div class="md-toggle">
						<button class:active={!showMarkdown} onclick={() => { showMarkdown = false; }}>Raw</button>
						<button class:active={showMarkdown} onclick={enableMarkdown}>Rendered</button>
					</div>
				{/if}
			</div>
			{#if showMarkdown && mdContent !== null}
				<div class="markdown-body">{@html mdContent}</div>
			{:else}
				<div class="file-content">
					{#each lines as line, i}
						<div class="line">
							<span class="lineno">{i + 1}</span>
							<span class="content">{line}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if diffStore.fileDiff}
		{#if isMdFile}
			<div class="md-toggle-bar">
				<button class:active={!showMarkdown} onclick={() => { showMarkdown = false; }}>Raw</button>
				<button class:active={showMarkdown} onclick={enableMarkdown}>Rendered</button>
			</div>
		{/if}
		{#if showMarkdown && mdContent !== null}
			<div class="markdown-body">{@html mdContent}</div>
		{:else if diffStore.viewMode === 'unified'}
			<UnifiedDiff file={diffStore.fileDiff} onExplainHunk={handleExplainHunk} />
		{:else if diffStore.viewMode === 'split'}
			<SplitDiff file={diffStore.fileDiff} onExplainHunk={handleExplainHunk} />
		{:else}
			<FullFileDiff file={diffStore.fileDiff} />
		{/if}
	{:else if diffStore.error}
		<div class="error">
			{diffStore.error}
			{#if diffStore.retryAction}
				<button class="retry-btn" onclick={() => diffStore.retryAction?.()}>Retry</button>
			{/if}
		</div>
	{:else if diffStore.summary && diffStore.summary.files.length === 0}
		<div class="empty">
			<svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="opacity:0.3;margin-bottom:12px">
				<circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5"/>
				<path d="M10 16h12M16 10v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			<span>No changes vs <strong>{diffStore.toRef || 'target'}</strong></span>
		</div>
	{:else if !diffStore.selectedFile}
		<div class="empty">
			<svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="opacity:0.3;margin-bottom:12px">
				<path d="M8 4h10l8 8v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.5"/>
				<path d="M18 4v8h8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
				<path d="M12 17h8M12 21h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			<span>Select a file to view its diff</span>
		</div>
	{/if}
</div>

<style>
	.diff-view {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-gutter: stable;
		padding: 16px;
	}
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		font-size: 0.929rem;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		font-size: 0.929rem;
		gap: 0;
	}
	.empty strong {
		color: var(--text-secondary);
		font-weight: 600;
	}
	.error {
		padding: 16px;
		color: var(--color-del);
		background: var(--diff-del-bg);
		border-radius: 6px;
		margin: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.retry-btn {
		padding: 4px 12px;
		border-radius: 4px;
		border: 1px solid var(--color-del);
		background: transparent;
		color: var(--color-del);
		font-size: 0.857rem;
		font-weight: 500;
		cursor: pointer;
		flex-shrink: 0;
	}
	.retry-btn:hover {
		background: var(--color-del);
		color: white;
	}
	.full-file {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.file-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.929rem;
		font-family: var(--font-mono);
		color: var(--text-muted);
		padding: 0 0 12px 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: 8px;
	}
	.file-content {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 0.929rem;
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

	/* Markdown toggle bar (diff mode) */
	.md-toggle-bar {
		display: flex;
		gap: 2px;
		margin-bottom: 12px;
	}

	/* Inline toggle inside file-header (all-files mode) */
	.md-toggle {
		display: flex;
		gap: 2px;
	}

	.md-toggle-bar button,
	.md-toggle button {
		padding: 2px 10px;
		font-size: 0.786rem;
		font-family: var(--font-sans);
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 4px;
	}
	.md-toggle-bar button:first-child,
	.md-toggle button:first-child {
		border-radius: 4px 0 0 4px;
	}
	.md-toggle-bar button:last-child,
	.md-toggle button:last-child {
		border-radius: 0 4px 4px 0;
		border-left: none;
	}
	.md-toggle-bar button.active,
	.md-toggle button.active {
		background: var(--text-muted);
		color: var(--bg-primary);
		border-color: var(--text-muted);
	}

	/* Markdown rendered output */
	.markdown-body {
		max-width: 800px;
		line-height: 1.7;
		color: var(--text-primary);
		font-size: 0.929rem;
		padding-bottom: 32px;
	}
	.markdown-body :global(h1),
	.markdown-body :global(h2),
	.markdown-body :global(h3),
	.markdown-body :global(h4) {
		color: var(--text-primary);
		font-weight: 600;
		margin: 1.4em 0 0.5em;
		line-height: 1.3;
	}
	.markdown-body :global(h1) { font-size: 1.6rem; }
	.markdown-body :global(h2) { font-size: 1.3rem; }
	.markdown-body :global(h3) { font-size: 1.1rem; }
	.markdown-body :global(p) { margin: 0.75em 0; }
	.markdown-body :global(ul),
	.markdown-body :global(ol) {
		padding-left: 1.5em;
		margin: 0.5em 0;
	}
	.markdown-body :global(li) { margin: 0.25em 0; }
	.markdown-body :global(code) {
		font-family: var(--font-mono);
		font-size: 0.857rem;
		background: var(--bg-secondary);
		padding: 1px 5px;
		border-radius: 3px;
	}
	.markdown-body :global(pre) {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 12px 16px;
		overflow-x: auto;
		margin: 0.75em 0;
	}
	.markdown-body :global(pre code) {
		background: none;
		padding: 0;
		font-size: 0.857rem;
	}
	.markdown-body :global(blockquote) {
		border-left: 3px solid var(--border);
		margin: 0.75em 0;
		padding: 0.25em 0 0.25em 1em;
		color: var(--text-muted);
	}
	.markdown-body :global(hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 1.5em 0;
	}
	.markdown-body :global(a) {
		color: var(--color-add);
		text-decoration: none;
	}
	.markdown-body :global(a:hover) { text-decoration: underline; }
	.markdown-body :global(table) {
		border-collapse: collapse;
		width: 100%;
		margin: 0.75em 0;
	}
	.markdown-body :global(th),
	.markdown-body :global(td) {
		border: 1px solid var(--border);
		padding: 6px 12px;
		text-align: left;
	}
	.markdown-body :global(th) {
		background: var(--bg-secondary);
		font-weight: 600;
	}
</style>
