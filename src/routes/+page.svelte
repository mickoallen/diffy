<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { open } from '@tauri-apps/plugin-dialog';
	import { invoke } from '@tauri-apps/api/core';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { repoStore } from '$lib/stores/repo.svelte';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { recentsStore } from '$lib/stores/recents.svelte';
	import { setupKeyboardShortcuts } from '$lib/utils/keyboard';
	import type { BranchInfo } from '$lib/services/git';
	import { getDefaultBranch, getRemoteUrl } from '$lib/services/git';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import BranchSelector from '$lib/components/git/BranchSelector.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import MainPanel from '$lib/components/layout/MainPanel.svelte';
	import AiPanel from '$lib/components/ai/AiPanel.svelte';
	import SettingsModal from '$lib/components/layout/SettingsModal.svelte';

	let repoPath = $state('');
	let remoteUrl = $state('');
	let repoOpened = $state(false);
	let unlistenRefresh: UnlistenFn | undefined;

	let cleanupKeyboard: (() => void) | undefined;

	onMount(async () => {
		await settingsStore.load();
		cleanupKeyboard = setupKeyboardShortcuts();

		listen<{ kind: string }>('git://refresh', async (event) => {
			if (!repoOpened || diffStore.loading) return;
			const { kind } = event.payload;
			if (kind === 'git-state') {
				const prevBranch = repoStore.currentBranch;
				await repoStore.refreshBranches();
				if (repoStore.currentBranch !== prevBranch) {
					diffStore.fromRef = repoStore.currentBranch;
				}
				await reloadCurrentDiff();
			} else if (kind === 'workdir') {
				await reloadCurrentDiff();
			}
		}).then((fn) => { unlistenRefresh = fn; });
	});

	onDestroy(() => {
		cleanupKeyboard?.();
		unlistenRefresh?.();
		if (repoOpened) {
			invoke('stop_watching').catch(() => {});
		}
	});

	function fallbackDefaultTarget(branches: BranchInfo[], currentBranch: string): string {
		for (const name of ['main', 'master', 'develop']) {
			if (name !== currentBranch && branches.find(b => b.name === name)) return name;
		}
		return branches.find(b => !b.is_head)?.name ?? '';
	}

	async function reloadCurrentDiff() {
		if (diffStore.fromRef && diffStore.toRef) {
			await diffStore.loadBranchDiff(diffStore.fromRef, diffStore.toRef);
		}
	}

	async function handleOpenRepo(path?: string) {
		const target = (path ?? repoPath).trim();
		if (!target) return;
		repoPath = target;
		await repoStore.open(target);
		if (!repoStore.error) {
			recentsStore.add(target);
			remoteUrl = await getRemoteUrl(target).catch(() => '');
			repoOpened = true;
			invoke('start_watching', { path: target }).catch(() => {});
			const fromRef = repoStore.currentBranch;
			let toRef = await getDefaultBranch(repoPath).catch(() => '');
			if (!toRef || toRef === fromRef) {
				toRef = fallbackDefaultTarget(repoStore.branches, fromRef);
			}
			await diffStore.loadBranchDiff(fromRef, toRef);
		}
	}

	function handleCloseRepo() {
		invoke('stop_watching').catch(() => {});
		repoStore.reset();
		diffStore.reset();
		repoOpened = false;
		repoPath = '';
		remoteUrl = '';
	}

	async function handleTargetChange(v: string) {
		diffStore.toRef = v;
		await reloadCurrentDiff();
	}
</script>

{#if !repoOpened}
	<div class="welcome">
		<div class="welcome-card">
			<div class="welcome-logo-wrap">
				<img src="/full-logo.png" alt="" class="welcome-logo-blur" aria-hidden="true" />
				<img src="/full-logo.png" alt="DiFFY" class="welcome-logo" />
			</div>
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
				<button type="submit" class="open-btn" disabled={repoStore.loading}>
				{#if repoStore.loading}
					<div class="btn-spinner"></div>
					Opening…
				{:else}
					Open Repository
				{/if}
			</button>
			</form>
			{#if repoStore.error}
				<div class="error">{repoStore.error}</div>
			{/if}
			{#if recentsStore.repos.length > 0}
				<div class="recents">
					<p class="recents-label">Recent</p>
					<ul class="recents-list">
						{#each recentsStore.repos as repo (repo.path)}
							<li class="recents-item">
								<button class="recents-open" onclick={() => handleOpenRepo(repo.path)} disabled={repoStore.loading}>
									{#if repoStore.loading && repoPath === repo.path}
										<div class="recents-spinner"></div>
									{/if}
									<span class="recents-name">{repo.name}</span>
									<span class="recents-path">{repo.path}</span>
								</button>
								<button class="recents-remove" onclick={() => recentsStore.remove(repo.path)} title="Remove" disabled={repoStore.loading}>×</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		<button class="splash-settings-btn" onclick={() => settingsStore.toggleSettings()} title="Settings">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
			</svg>
		</button>
	</div>
{:else}
	<div class="app">
		<header class="top-bar">
			<img src="/no-text-logo.png" alt="DiFFY" class="top-bar-logo" />
			<button class="back-btn" onclick={handleCloseRepo} title="Change project">
				<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
					<path d="M9 3L4 7.5 9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			{#if remoteUrl}
				<button class="repo-name repo-link" onclick={() => openUrl(remoteUrl)}>{remoteUrl.replace('https://', '')}</button>
			{:else}
				<span class="repo-name">{repoPath.split('/').at(-1)}</span>
			{/if}
			<div class="branch-controls">
				<span class="current-branch">{repoStore.currentBranch}</span>
				<svg class="arrow-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<BranchSelector
					label=""
					value={diffStore.toRef}
					onchange={handleTargetChange}
				/>
			</div>
			<div class="top-actions">
				<button
					class="icon-btn"
					class:active={settingsStore.showAiPanel}
					onclick={() => settingsStore.toggleAiPanel()}
					title="AI Panel (a)"
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<path d="M7.5 1a6.5 6.5 0 1 1 0 13A6.5 6.5 0 0 1 7.5 1z" stroke="currentColor" stroke-width="1.3"/>
						<path d="M5 6c0-1.38 1.12-2.5 2.5-2.5S10 4.62 10 6c0 1.1-.67 2.04-1.63 2.36L8 9H7l-.37-1.64C5.67 8.04 5 7.1 5 6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
						<rect x="7" y="10" width="1" height="1.5" rx=".5" fill="currentColor"/>
					</svg>
					AI
				</button>
				<button class="icon-btn" onclick={() => settingsStore.toggleSettings()} title="Settings">
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.3"/>
						<path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M11.7 3.3l-1.06 1.06M4.36 10.64l-1.06 1.06M11.7 11.7l-1.06-1.06M4.36 4.36 3.3 3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
					</svg>
				</button>
			</div>
		</header>

		<div class="content">
			<Sidebar />
			<MainPanel />
			{#if settingsStore.showAiPanel}
				<AiPanel />
			{/if}
			{#if diffStore.loading}
				<div class="loading-overlay">
					<div class="spinner"></div>
					<span>Loading diff…</span>
				</div>
			{/if}
		</div>

		<footer class="status-bar">
			{#if diffStore.loading}
				<span class="status-muted">Loading…</span>
			{:else if diffStore.summary}
				<span class="stat-files">{diffStore.summary.files.length} file{diffStore.summary.files.length !== 1 ? 's' : ''}</span>
				{#if diffStore.summary.total_additions > 0}
					<span class="stat-add">+{diffStore.summary.total_additions}</span>
				{/if}
				{#if diffStore.summary.total_deletions > 0}
					<span class="stat-del">−{diffStore.summary.total_deletions}</span>
				{/if}
			{/if}
			<span class="spacer"></span>
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
		position: relative;
		overflow: hidden;
	}

	.welcome::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 80% 70% at 5% 95%, var(--color-add), transparent 70%),
			radial-gradient(ellipse 70% 80% at 95% 90%, var(--color-del), transparent 70%),
			radial-gradient(ellipse 70% 70% at 90% 5%, var(--color-rename), transparent 70%),
			radial-gradient(ellipse 80% 60% at 5% 10%, var(--color-accent), transparent 70%),
			radial-gradient(ellipse 60% 60% at 50% 50%, var(--color-mod), transparent 70%);
		opacity: 0.08;
		filter: blur(120px);
		pointer-events: none;
	}

	.welcome::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse 85% 75% at 50% 50%, transparent, var(--bg-primary));
		pointer-events: none;
	}
	.splash-settings-btn {
		position: absolute;
		top: 16px;
		right: 16px;
		z-index: 1;
		background: none;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 8px;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.splash-settings-btn:hover {
		color: var(--text-primary);
		border-color: var(--text-muted);
	}

	.welcome-card {
		text-align: center;
		max-width: 480px;
		padding: 48px;
	}
	.welcome-logo-wrap {
		position: relative;
		height: 224px;
		margin-bottom: 12px;
	}
	.welcome-logo,
	.welcome-logo-blur {
		height: 224px;
		width: auto;
	}
	.welcome-logo {
		position: relative;
		z-index: 1;
	}
	.welcome-logo-blur {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0.9);
		filter: blur(24px) opacity(0.9);
		z-index: 0;
	}
	:global([data-theme='chalk']),
	:global([data-theme='nate']) {
		.welcome-logo-blur {
			filter: blur(40px) opacity(1) grayscale(1) brightness(0);
			transform: translate(-50%, -50%) scale(1.1);
		}
		.welcome::before {
			opacity: 0.35;
		}
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
		font-size: 1rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		box-sizing: border-box;
	}
	.browse-btn {
		padding: 12px 16px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 1rem;
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
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.open-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.open-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}
	.btn-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255,255,255,0.4);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	.error {
		margin-top: 12px;
		color: var(--color-del);
		font-size: 0.929rem;
	}
	.recents {
		margin-top: 24px;
		border-top: 1px solid var(--border);
		padding-top: 16px;
	}
	.recents-label {
		font-size: 0.786rem;
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
		font-size: 0.929rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	.recents-path {
		font-size: 0.786rem;
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
		font-size: 1.143rem;
		cursor: pointer;
		border-radius: 4px;
		opacity: 0;
		margin-right: 6px;
	}
	.recents-item:hover .recents-remove {
		opacity: 1;
	}
	.recents-open:disabled,
	.recents-remove:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.recents-spinner {
		width: 12px;
		height: 12px;
		border: 1.5px solid var(--border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	.recents-remove:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
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
	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 5px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
	}
	.back-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}
	.repo-name {
		font-size: 0.857rem;
		font-weight: 600;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.repo-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
		text-decoration: none;
	}

	.repo-link:hover {
		color: var(--text-primary);
		text-decoration: underline;
	}
	.branch-controls {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		justify-content: center;
	}
	.current-branch {
		font-size: 0.929rem;
		font-weight: 600;
		color: var(--text-primary);
		font-family: 'SF Mono', 'Fira Code', monospace;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 10px;
		white-space: nowrap;
	}
	.arrow-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.top-actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}
	.icon-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 6px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.857rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s, background 0.15s, border-color 0.15s;
	}
	.icon-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
		border-color: var(--border);
	}
	.icon-btn.active {
		color: var(--color-accent);
		background: var(--bg-tertiary);
		border-color: var(--color-accent);
	}
	.content {
		flex: 1;
		display: flex;
		overflow: hidden;
		position: relative;
	}
	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: var(--bg-primary);
		color: var(--text-muted);
		font-size: 0.929rem;
		z-index: 50;
	}
	.spinner {
		width: 28px;
		height: 28px;
		border: 2.5px solid var(--border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.status-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 16px;
		border-top: 1px solid var(--border);
		background: var(--bg-secondary);
		font-size: 0.786rem;
		color: var(--text-muted);
		min-height: 24px;
	}
	.stat-files {
		color: var(--text-secondary);
	}
	.stat-add {
		color: var(--color-add);
		font-weight: 600;
	}
	.stat-del {
		color: var(--color-del);
		font-weight: 600;
	}
	.status-muted {
		color: var(--text-muted);
		font-style: italic;
	}
	.spacer {
		flex: 1;
	}
</style>
