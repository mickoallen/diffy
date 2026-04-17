<script lang="ts">
	import { diffStore } from '$lib/stores/diff.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { reviewedStore } from '$lib/stores/reviewed.svelte';
	import { repoPrefsStore } from '$lib/stores/repoPrefs.svelte';
	import type { FileSummary } from '$lib/services/git';
	import { getFileCategory } from '$lib/utils/fileType';

	const statusIcon: Record<string, string> = {
		Added: 'A',
		Deleted: 'D',
		Modified: 'M',
		Renamed: 'R'
	};

	const statusClass: Record<string, string> = {
		Added: 'added',
		Deleted: 'deleted',
		Modified: 'modified',
		Renamed: 'renamed'
	};

	interface TreeNode {
		name: string;
		path: string;
		children: TreeNode[];
		file?: FileSummary | { path: string };
	}

	// Collapsed folder paths — persists across tree rebuilds, and across sessions per repo.
	let collapsedPaths = $state(new Set<string>());

	// Resizable sidebar width
	let sidebarWidth = $state(260);
	const MIN_WIDTH = 160;
	const MAX_WIDTH = 600;

	// Restore per-repo prefs whenever the current repo changes.
	$effect(() => {
		const prefs = repoPrefsStore.current;
		if (typeof prefs.sidebarWidth === 'number') sidebarWidth = prefs.sidebarWidth;
		if (prefs.collapsedPaths) collapsedPaths = new Set(prefs.collapsedPaths);
	});

	function startResize(e: MouseEvent) {
		e.preventDefault();
		const startX = e.clientX;
		const startWidth = sidebarWidth;

		function onMove(e: MouseEvent) {
			sidebarWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + e.clientX - startX));
		}
		function onUp() {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			repoPrefsStore.update({ sidebarWidth });
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	// Keyboard resize for the separator: arrow keys nudge width, Home/End snap to bounds.
	function onResizeKeydown(e: KeyboardEvent) {
		const STEP = e.shiftKey ? 40 : 10;
		let next = sidebarWidth;
		switch (e.key) {
			case 'ArrowLeft':  next -= STEP; break;
			case 'ArrowRight': next += STEP; break;
			case 'Home':       next = MIN_WIDTH; break;
			case 'End':        next = MAX_WIDTH; break;
			default: return;
		}
		e.preventDefault();
		sidebarWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next));
		repoPrefsStore.update({ sidebarWidth });
	}

	function buildTree(paths: string[], diffFiles: Map<string, FileSummary>): TreeNode[] {
		const root: TreeNode[] = [];

		for (const p of paths) {
			const parts = p.split('/');
			let nodes = root;
			let currentPath = '';
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				currentPath = currentPath ? `${currentPath}/${part}` : part;
				const isFile = i === parts.length - 1;
				let node = nodes.find((n) => n.name === part);
				if (!node) {
					node = {
						name: part,
						path: currentPath,
						children: [],
						file: isFile ? (diffFiles.get(p) ?? { path: p }) : undefined
					};
					nodes.push(node);
				}
				nodes = node.children;
			}
		}

		return root;
	}

	let diffFileMap = $derived.by(() => {
		const map = new Map<string, FileSummary>();
		for (const f of diffStore.summary?.files ?? []) {
			map.set(f.path, f);
		}
		return map;
	});

	let filteredDiffPaths = $derived(
		(diffStore.summary?.files ?? [])
			.filter((f) =>
				settingsStore.fileFilter
					? f.path.toLowerCase().includes(settingsStore.fileFilter.toLowerCase())
					: true
			)
			.map((f) => f.path)
	);

	let filteredAllPaths = $derived(
		diffStore.allFiles.filter((p) =>
			settingsStore.fileFilter
				? p.toLowerCase().includes(settingsStore.fileFilter.toLowerCase())
				: true
		)
	);

	let displayPaths = $derived(
		diffStore.treeMode === 'diffs' ? filteredDiffPaths : filteredAllPaths
	);

	let tree = $derived(buildTree(displayPaths, diffFileMap));

	let fileCount = $derived(displayPaths.length);

	function toggleFolder(node: TreeNode) {
		if (collapsedPaths.has(node.path)) {
			collapsedPaths.delete(node.path);
		} else {
			collapsedPaths.add(node.path);
		}
		collapsedPaths = new Set(collapsedPaths); // trigger reactivity
		repoPrefsStore.update({ collapsedPaths: [...collapsedPaths] });
	}

	function selectNode(node: TreeNode) {
		if (!node.file) return;
		const diffFile = diffFileMap.get(node.path);
		if (diffFile) {
			diffStore.selectFile(diffFile);
			diffStore.selectedRepoFile = null;
			diffStore.fullFileContent = null;
		} else {
			diffStore.selectRepoFile(node.path);
		}
	}

	function isSelected(node: TreeNode): boolean {
		if (diffStore.treeMode === 'diffs') {
			return diffStore.selectedFile?.path === node.path;
		}
		const diffFile = diffFileMap.get(node.path);
		if (diffFile) return diffStore.selectedFile?.path === node.path;
		return diffStore.selectedRepoFile === node.path;
	}
</script>

<aside class="sidebar" style="width: {sidebarWidth}px; min-width: {sidebarWidth}px;">
	<div class="filter-row">
		<input
			id="file-filter"
			type="text"
			placeholder="Filter files... (f)"
			bind:value={settingsStore.fileFilter}
			class="filter-input"
		/>
	</div>

	<div class="mode-row">
		<div class="mode-toggle">
			<button
				class="mode-btn"
				class:active={diffStore.treeMode === 'diffs'}
				onclick={() => diffStore.setTreeMode('diffs')}
			>
				Diffs
			</button>
			<button
				class="mode-btn"
				class:active={diffStore.treeMode === 'all'}
				onclick={() => diffStore.setTreeMode('all')}
			>
				All Files
			</button>
		</div>
		<span class="file-count">{fileCount}</span>
	</div>

	<div class="file-tree">
		{#snippet renderTree(nodes: TreeNode[], depth: number)}
			{#each nodes as node}
				{#if node.file}
					<!-- File node -->
					{@const diffFile = diffFileMap.get(node.path)}
					{@const category = getFileCategory(node.path)}
					<div
						class="file-row"
						class:selected={isSelected(node)}
						class:reviewed={diffFile && reviewedStore.has(node.path)}
						style="padding-left: {8 + depth * 14}px"
					>
						<button
							type="button"
							class="file-item"
							onclick={() => selectNode(node)}
						>
							{#if diffFile}
								<span class="status {statusClass[diffFile.status]}">{statusIcon[diffFile.status]}</span>
							{:else}
								<span class="status-placeholder"></span>
							{/if}
							<span class="filetype-dot filetype-{category}" aria-hidden="true"></span>
							<span class="name {diffFile ? statusClass[diffFile.status] : ''}">{node.name}</span>
							{#if diffFile}
								{#if diffFile.is_binary}
									<span class="binary-badge">BIN</span>
								{:else}
									<span class="stats">
										{#if diffFile.additions > 0}<span class="add">+{diffFile.additions}</span>{/if}
										{#if diffFile.deletions > 0}<span class="del">-{diffFile.deletions}</span>{/if}
									</span>
								{/if}
							{/if}
						</button>
						{#if diffFile}
							<button
								type="button"
								class="review-check"
								class:checked={reviewedStore.has(node.path)}
								tabindex="-1"
								aria-label={reviewedStore.has(node.path) ? 'Mark as not reviewed' : 'Mark as reviewed'}
								title="Mark reviewed (v)"
								onclick={() => reviewedStore.toggle(node.path)}
							>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
									<path d="M2.5 6.5L5 9l4.5-5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
						{/if}
					</div>
				{:else}
					<!-- Folder node -->
					{@const expanded = !collapsedPaths.has(node.path)}
					<button
						class="dir-item"
						style="padding-left: {8 + depth * 14}px"
						onclick={() => toggleFolder(node)}
					>
						<svg class="chevron" class:open={expanded} width="10" height="10" viewBox="0 0 10 10" fill="none">
							<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="dir-name">{node.name}/</span>
					</button>
					{#if expanded}
						{@render renderTree(node.children, depth + 1)}
					{/if}
				{/if}
			{/each}
		{/snippet}
		{@render renderTree(tree, 0)}
	</div>
	<div
		class="resize-handle"
		role="slider"
		aria-orientation="vertical"
		aria-label="Resize sidebar"
		aria-valuemin={MIN_WIDTH}
		aria-valuemax={MAX_WIDTH}
		aria-valuenow={sidebarWidth}
		tabindex="0"
		onmousedown={startResize}
		onkeydown={onResizeKeydown}
	></div>
</aside>

<style>
	.sidebar {
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary);
		overflow-y: auto;
		position: relative;
		flex-shrink: 0;
	}
	.resize-handle {
		position: absolute;
		top: 0;
		right: -3px;
		width: 6px;
		height: 100%;
		cursor: col-resize;
		z-index: 10;
	}
	.resize-handle:hover,
	.resize-handle:active {
		background: var(--color-accent);
		opacity: 0.4;
	}
	.filter-row {
		padding: 8px;
		border-bottom: 1px solid var(--border);
	}
	.filter-input {
		width: 100%;
		padding: 5px 8px;
		border-radius: 5px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.857rem;
		box-sizing: border-box;
	}
	.filter-input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	.mode-row {
		display: flex;
		align-items: center;
		padding: 5px 8px;
		border-bottom: 1px solid var(--border);
		gap: 6px;
	}
	.mode-toggle {
		display: flex;
		background: var(--bg-primary);
		border-radius: 5px;
		padding: 2px;
		gap: 1px;
		border: 1px solid var(--border);
	}
	.mode-btn {
		padding: 2px 10px;
		border: none;
		border-radius: 3px;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.786rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.12s, background 0.12s;
	}
	.mode-btn.active {
		background: var(--bg-active);
		color: var(--text-primary);
	}
	.file-count {
		margin-left: auto;
		font-size: 0.786rem;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0 6px;
		min-width: 20px;
		text-align: center;
		line-height: 18px;
	}
	.file-tree {
		flex: 1;
		overflow-y: auto;
		overflow-x: auto;
	}
	.dir-item {
		display: flex;
		align-items: center;
		gap: 5px;
		width: max-content;
		min-width: 100%;
		border: none;
		background: var(--bg-tertiary);
		color: var(--text-muted);
		font-size: 0.857rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		cursor: pointer;
		text-align: left;
		padding-top: 4px;
		padding-bottom: 4px;
		padding-right: 8px;
	}
	.dir-item:hover {
		background: var(--bg-hover);
	}
	.chevron {
		flex-shrink: 0;
		color: var(--text-muted);
		transition: transform 0.15s;
		transform: rotate(0deg);
	}
	.chevron.open {
		transform: rotate(90deg);
	}
	.dir-name {
		flex: 1;
	}
	.file-row {
		display: flex;
		align-items: center;
		width: max-content;
		min-width: 100%;
		padding-right: 8px;
	}
	.file-row.selected {
		background: var(--bg-active);
	}
	.file-row:hover {
		background: var(--bg-hover);
	}
	.file-row.selected:hover {
		background: var(--bg-active);
	}
	.file-item {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 6px;
		padding-top: 4px;
		padding-bottom: 4px;
		padding-right: 8px;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: 0.929rem;
		cursor: pointer;
		text-align: left;
	}
	.file-row.reviewed .name {
		color: var(--text-muted);
		text-decoration: line-through;
		text-decoration-thickness: 1px;
	}
	.review-check {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		border: none;
		border-radius: 3px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0.35;
		flex-shrink: 0;
	}
	.review-check.checked {
		color: var(--color-add);
		opacity: 1;
	}
	.file-row:hover .review-check {
		opacity: 1;
	}
	.review-check:hover {
		background: var(--bg-tertiary);
	}
	.status {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.786rem;
		font-weight: 600;
		width: 16px;
		text-align: center;
		flex-shrink: 0;
	}
	.status-placeholder {
		width: 16px;
		flex-shrink: 0;
	}
	.status.added {
		color: var(--color-add);
	}
	.status.deleted {
		color: var(--color-del);
	}
	.status.modified {
		color: var(--color-mod);
	}
	.status.renamed {
		color: var(--color-rename);
	}
	.filetype-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex-shrink: 0;
		background: var(--color-filetype-other);
	}
	.filetype-dot.filetype-script { background: var(--color-filetype-script); }
	.filetype-dot.filetype-style { background: var(--color-filetype-style); }
	.filetype-dot.filetype-markup { background: var(--color-filetype-markup); }
	.filetype-dot.filetype-config { background: var(--color-filetype-config); }
	.filetype-dot.filetype-data { background: var(--color-filetype-data); }
	.filetype-dot.filetype-image { background: var(--color-filetype-image); }
	.filetype-dot.filetype-doc { background: var(--color-filetype-doc); }
	.name.added { color: var(--color-add); }
	.name.deleted { color: var(--color-del); }
	.name.modified { color: var(--color-mod); }
	.name.renamed { color: var(--color-rename); }
	.name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.stats {
		font-size: 0.786rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		flex-shrink: 0;
	}
	.add {
		color: var(--color-add);
	}
	.del {
		color: var(--color-del);
		margin-left: 4px;
	}
	.binary-badge {
		font-size: 0.714rem;
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 0 4px;
		flex-shrink: 0;
	}
</style>
