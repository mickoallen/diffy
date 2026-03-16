<script lang="ts">
	import { onMount } from 'svelte';
	import { open } from '@tauri-apps/plugin-dialog';
	import { repoStore } from '$lib/stores/repo.svelte';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { recentsStore } from '$lib/stores/recents.svelte';
	import { setupKeyboardShortcuts } from '$lib/utils/keyboard';
	import BranchSelector from '$lib/components/git/BranchSelector.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import MainPanel from '$lib/components/layout/MainPanel.svelte';
	import AiPanel from '$lib/components/ai/AiPanel.svelte';
	import SettingsModal from '$lib/components/layout/SettingsModal.svelte';

	let repoPath = $state('');
	let repoOpened = $state(false);

	onMount(() => {
		document.documentElement.setAttribute('data-theme', settingsStore.theme);
		const cleanup = setupKeyboardShortcuts();
		return cleanup;
	});

	async function handleOpenRepo(path?: string) {
		const target = (path ?? repoPath).trim();
		if (!target) return;
		repoPath = target;
		await repoStore.open(target);
		if (!repoStore.error) {
			recentsStore.add(target);
			repoOpened = true;
			// Try workdir first (most useful on open), fall back to vs-remote
			await diffStore.loadWorkdirDiff();
			if (!diffStore.error && diffStore.summary?.files.length === 0) {
				diffStore.error = '';
				await diffStore.loadLocalVsRemote();
			}
		}
	}

	async function handleTabChange(tab: 'workdir' | 'local-vs-remote' | 'branch-vs-branch') {
		if (tab === 'workdir') {
			await diffStore.loadWorkdirDiff();
		} else if (tab === 'local-vs-remote') {
			await diffStore.loadLocalVsRemote();
		} else if (tab === 'branch-vs-branch') {
			if (diffStore.fromRef && diffStore.toRef) {
				await diffStore.loadBranchDiff(diffStore.fromRef, diffStore.toRef);
			}
		}
	}

	async function handleBranchCompare() {
		if (diffStore.fromRef && diffStore.toRef) {
			await diffStore.loadBranchDiff(diffStore.fromRef, diffStore.toRef);
		}
	}
</script>

{#if !repoOpened}
	<div class="welcome">
		<div class="welcome-card">
			<img src="/full-logo.png" alt="DiFFY" class="welcome-logo" />
			<p>Fast, beautiful local git diff viewer</p>
			<form onsubmit={(e) => { e.preventDefault(); handleOpenRepo(); }}>
				<!-- svelte-ignore a11y_autofocus -->
				<div class="input-row">
					<input
						type="text"
						bind:value={repoPath}
						placeholder="/path/to/git/repo"
						class="repo-input"
						autofocus
					/>
					<button type="button" class="browse-btn" onclick={async () => {
						const selected = await open({ directory: true });
						if (selected) handleOpenRepo(selected);
					}}>Browse</button>
				</div>
				<button type="submit" class="open-btn">Open Repository</button>
			</form>
			{#if repoStore.error}
				<div class="error">{repoStore.error}</div>
			{/if}
			{#if repoStore.loading}
				<div class="loading">Opening...</div>
			{/if}
			{#if recentsStore.repos.length > 0}
				<div class="recents">
					<p class="recents-label">Recent</p>
					<ul class="recents-list">
						{#each recentsStore.repos as repo (repo.path)}
							<li class="recents-item">
								<button class="recents-open" onclick={() => handleOpenRepo(repo.path)}>
									<span class="recents-name">{repo.name}</span>
									<span class="recents-path">{repo.path}</span>
								</button>
								<button class="recents-remove" onclick={() => recentsStore.remove(repo.path)} title="Remove">×</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="app">
		<header class="top-bar">
			<img src="/no-text-logo.png" alt="DiFFY" class="top-bar-logo" />
			<nav class="tabs">
				<button
					class="tab"
					class:active={diffStore.compareMode === 'workdir'}
					onclick={() => handleTabChange('workdir')}
				>Working Tree</button>
				<button
					class="tab"
					class:active={diffStore.compareMode === 'local-vs-remote'}
					onclick={() => handleTabChange('local-vs-remote')}
				>vs Remote</button>
				<button
					class="tab"
					class:active={diffStore.compareMode === 'branch-vs-branch'}
					onclick={() => handleTabChange('branch-vs-branch')}
				>Compare</button>
			</nav>
			{#if diffStore.compareMode === 'branch-vs-branch'}
				<div class="branch-controls">
					<BranchSelector
						label="From"
						value={diffStore.fromRef}
						onchange={(v) => { diffStore.fromRef = v; handleBranchCompare(); }}
					/>
					<span class="arrow">→</span>
					<BranchSelector
						label="To"
						value={diffStore.toRef}
						onchange={(v) => { diffStore.toRef = v; handleBranchCompare(); }}
					/>
				</div>
			{/if}
			<div class="top-actions">
				<button class="icon-btn" onclick={() => settingsStore.toggleAiPanel()} title="AI Panel (a)">
					AI
				</button>
				<button class="icon-btn" onclick={() => settingsStore.toggleSettings()} title="Settings">
					⚙
				</button>
			</div>
		</header>

		<div class="content">
			<Sidebar />
			<MainPanel />
			{#if settingsStore.showAiPanel}
				<AiPanel />
			{/if}
		</div>

		<footer class="status-bar">
			{#if diffStore.summary}
				<span>
					{diffStore.summary.files.length} file{diffStore.summary.files.length !== 1 ? 's' : ''} changed
				</span>
				<span class="stat-add">+{diffStore.summary.total_additions}</span>
				<span class="stat-del">-{diffStore.summary.total_deletions}</span>
			{/if}
			<span class="spacer"></span>
			<span class="mode">{{workdir: 'Working Tree', 'local-vs-remote': 'vs Remote', 'branch-vs-branch': 'Compare'}[diffStore.compareMode]}</span>
			<span class="view">{diffStore.viewMode}</span>
		</footer>
	</div>
{/if}

<SettingsModal />

<style>
	.welcome {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
	}
	.welcome-card {
		text-align: center;
		max-width: 480px;
		padding: 48px;
	}
	.welcome-logo {
		height: 224px;
		width: auto;
		margin-bottom: 12px;
	}
	.welcome-card p {
		color: var(--text-muted);
		margin: 0 0 32px;
	}
	.input-row {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}
	.repo-input {
		flex: 1;
		padding: 12px 16px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 14px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		box-sizing: border-box;
	}
	.browse-btn {
		padding: 12px 16px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.browse-btn:hover {
		background: var(--bg-hover);
	}
	.open-btn {
		width: 100%;
		padding: 10px;
		border-radius: 8px;
		border: none;
		background: var(--color-accent);
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}
	.open-btn:hover {
		opacity: 0.9;
	}
	.error {
		margin-top: 12px;
		color: var(--color-del);
		font-size: 13px;
	}
	.recents {
		margin-top: 24px;
		border-top: 1px solid var(--border);
		padding-top: 16px;
	}
	.recents-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin: 0 0 8px;
	}
	.recents-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.recents-item {
		display: flex;
		align-items: center;
		gap: 4px;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.recents-item:hover {
		background: var(--bg-primary);
	}
	.recents-open {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1px;
		padding: 7px 10px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		border-radius: 6px;
		min-width: 0;
	}
	.recents-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
	}
	.recents-path {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 340px;
	}
	.recents-remove {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 16px;
		cursor: pointer;
		border-radius: 4px;
		opacity: 0;
		margin-right: 6px;
	}
	.recents-item:hover .recents-remove {
		opacity: 1;
	}
	.recents-remove:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}
	.loading {
		margin-top: 12px;
		color: var(--text-muted);
	}

	.app {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-secondary);
		gap: 12px;
	}
	.top-bar-logo {
		height: 24px;
		width: auto;
		flex-shrink: 0;
	}
	.tabs {
		display: flex;
		gap: 2px;
	}
	.tab {
		padding: 5px 14px;
		border-radius: 6px;
		border: 1px solid transparent;
		background: none;
		color: var(--text-muted);
		font-size: 13px;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}
	.tab:hover {
		color: var(--text-primary);
		background: var(--bg-primary);
	}
	.tab.active {
		color: var(--text-primary);
		background: var(--bg-primary);
		border-color: var(--border);
	}
	.branch-controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.arrow {
		color: var(--text-muted);
		font-size: 16px;
	}
	.top-actions {
		display: flex;
		gap: 8px;
	}
	.icon-btn {
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-secondary);
		font-size: 13px;
		cursor: pointer;
	}
	.icon-btn:hover {
		background: var(--bg-hover);
	}
	.content {
		flex: 1;
		display: flex;
		overflow: hidden;
	}
	.status-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 4px 16px;
		border-top: 1px solid var(--border);
		background: var(--bg-secondary);
		font-size: 12px;
		color: var(--text-muted);
	}
	.stat-add {
		color: var(--color-add);
	}
	.stat-del {
		color: var(--color-del);
	}
	.spacer {
		flex: 1;
	}
	.mode, .view {
		padding: 1px 6px;
		border: 1px solid var(--border);
		border-radius: 3px;
		font-size: 11px;
	}
</style>
