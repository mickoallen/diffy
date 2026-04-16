<script lang="ts">
	import { diffStore } from '$lib/stores/diff.svelte';
	import { paletteStore } from '$lib/stores/palette.svelte';
	import { fuzzyFilter, highlightMatches, type FuzzyResult } from '$lib/utils/fuzzy';
	import { focusTrap } from '$lib/utils/focusTrap';
	import type { FileSummary } from '$lib/services/git';

	const MAX_RESULTS = 40;

	let query = $state('');
	let activeIdx = $state(0);
	let inputEl: HTMLInputElement | null = $state(null);

	// Palette draws from the current diff's files; if empty, fall back to all repo files.
	let pool = $derived.by(() => {
		const diffFiles = diffStore.summary?.files ?? [];
		if (diffFiles.length > 0) return diffFiles;
		return diffStore.allFiles.map((path) => ({
			path,
			old_path: null,
			status: 'Modified',
			additions: 0,
			deletions: 0,
			is_binary: false
		})) as FileSummary[];
	});

	let results = $derived.by<FuzzyResult<FileSummary>[]>(() => {
		const all = fuzzyFilter(pool, query.trim(), (f) => f.path);
		return all.slice(0, MAX_RESULTS);
	});

	$effect(() => {
		// Reset cursor whenever results change (query or pool).
		activeIdx = results.length > 0 ? 0 : -1;
	});

	$effect(() => {
		if (paletteStore.open) {
			query = '';
			activeIdx = 0;
		}
	});

	function selectActive() {
		const pick = results[activeIdx];
		if (!pick) return;
		const diffFile = diffStore.summary?.files.find((f) => f.path === pick.item.path);
		if (diffFile) {
			diffStore.selectFile(diffFile);
		} else {
			diffStore.selectRepoFile(pick.item.path);
		}
		paletteStore.hide();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = Math.min(results.length - 1, activeIdx + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = Math.max(0, activeIdx - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			selectActive();
		}
	}

	function statusClass(status: string): string {
		return status.toLowerCase();
	}
</script>

{#if paletteStore.open}
	<div
		class="backdrop"
		onclick={(e) => { if (e.target === e.currentTarget) paletteStore.hide(); }}
		role="presentation"
	>
		<div
			class="palette"
			role="dialog"
			aria-modal="true"
			aria-label="Jump to file"
			tabindex="-1"
			{@attach focusTrap({ onEscape: () => paletteStore.hide(), initialFocus: inputEl })}
		>
			<input
				bind:this={inputEl}
				bind:value={query}
				onkeydown={onKeydown}
				type="text"
				class="palette-input"
				placeholder="Jump to file…"
				aria-label="File search"
				autocomplete="off"
				spellcheck="false"
			/>
			<div class="results" role="listbox" aria-label="Matching files">
				{#if results.length === 0}
					<div class="empty">
						{query ? `No files match "${query}"` : 'No files available'}
					</div>
				{:else}
					{#each results as r, i (r.item.path)}
						<button
							type="button"
							class="result"
							class:active={i === activeIdx}
							role="option"
							aria-selected={i === activeIdx}
							onmouseenter={() => (activeIdx = i)}
							onclick={selectActive}
						>
							<span class="status {statusClass(r.item.status)}">
								{r.item.status[0]}
							</span>
							<span class="path">{@html highlightMatches(r.item.path, r.matches)}</span>
							{#if r.item.additions > 0 || r.item.deletions > 0}
								<span class="stats">
									{#if r.item.additions > 0}<span class="add">+{r.item.additions}</span>{/if}
									{#if r.item.deletions > 0}<span class="del">−{r.item.deletions}</span>{/if}
								</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 12vh;
		z-index: 300;
	}
	.palette {
		width: min(640px, 92vw);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		max-height: 70vh;
	}
	.palette-input {
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 0.929rem;
		border-bottom: 1px solid var(--border);
		box-sizing: border-box;
	}
	.palette-input:focus {
		outline: none;
	}
	.results {
		overflow-y: auto;
		padding: 4px 0;
	}
	.empty {
		padding: 16px;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.857rem;
		font-style: italic;
	}
	.result {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		background: transparent;
		border: none;
		text-align: left;
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 0.857rem;
		cursor: pointer;
	}
	.result.active {
		background: var(--bg-active);
		color: var(--text-primary);
	}
	.status {
		width: 14px;
		text-align: center;
		font-weight: 600;
		font-size: 0.786rem;
		flex-shrink: 0;
	}
	.status.added { color: var(--color-add); }
	.status.deleted { color: var(--color-del); }
	.status.modified { color: var(--color-mod); }
	.status.renamed { color: var(--color-rename); }
	.path {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		direction: rtl;
		text-align: left;
	}
	.path :global(mark) {
		background: transparent;
		color: var(--color-accent);
		font-weight: 700;
	}
	.stats {
		flex-shrink: 0;
		font-size: 0.786rem;
	}
	.add { color: var(--color-add); margin-right: 4px; }
	.del { color: var(--color-del); }
</style>
