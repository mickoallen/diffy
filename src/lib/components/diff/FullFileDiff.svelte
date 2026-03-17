<script lang="ts">
	import { onMount } from 'svelte';
	import type { FileDiff, DiffLine } from '$lib/services/git';
	import { getFileContent } from '$lib/services/git';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { repoStore } from '$lib/stores/repo.svelte';
	import { highlightLine } from '$lib/utils/highlighter';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import DiffHeader from './DiffHeader.svelte';
	import DiffLineRow from './DiffLine.svelte';

	interface Props {
		file: FileDiff;
	}

	let { file }: Props = $props();

	let displayLines = $state<DiffLine[]>([]);
	let highlightedLines = $state<string[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		file;
		buildLines();
	});

	$effect(() => {
		const lines = displayLines;
		const path = file.path;
		const theme = settingsStore.isDark ? 'dark' : 'light';
		const result: string[] = new Array(lines.length).fill('');
		highlightedLines = result;
		lines.forEach((line, i) => {
			highlightLine(line.content, path, theme).then((html) => {
				result[i] = html;
				highlightedLines = result.slice();
			});
		});
	});

	async function buildLines() {
		loading = true;
		error = '';
		try {
			const ref = diffStore.toRef || 'HEAD';
			const raw = file.status === 'Deleted'
				? []
				: await getFileContent(repoStore.path, ref, file.path);

			// Build lookup: new_lineno -> origin for hunk lines
			const lineOrigin = new Map<number, 'Addition' | 'Context'>();
			// deletions to insert before a given new_lineno (or at end if null)
			const deletionsBefore = new Map<number | null, DiffLine[]>();

			for (const hunk of file.hunks) {
				let pending: DiffLine[] = [];
				for (const l of hunk.lines) {
					if (l.origin === 'Deletion') {
						pending.push(l);
					} else {
						// Context or Addition — flush pending deletions to this new_lineno
						if (pending.length > 0) {
							const key = l.new_lineno;
							deletionsBefore.set(key, [...(deletionsBefore.get(key) ?? []), ...pending]);
							pending = [];
						}
						if (l.new_lineno != null) {
							lineOrigin.set(l.new_lineno, l.origin as 'Addition' | 'Context');
						}
					}
				}
				if (pending.length > 0) {
					// Trailing deletions at end of hunk → place after last line
					deletionsBefore.set(null, [...(deletionsBefore.get(null) ?? []), ...pending]);
				}
			}

			const result: DiffLine[] = [];
			for (let i = 0; i < raw.length; i++) {
				const lineno = i + 1;
				const before = deletionsBefore.get(lineno);
				if (before) {
					result.push(...before);
				}
				result.push({
					origin: lineOrigin.get(lineno) ?? 'Context',
					content: raw[i],
					old_lineno: null,
					new_lineno: lineno
				});
			}
			// Trailing deletions
			const trailing = deletionsBefore.get(null);
			if (trailing) result.push(...trailing);

			displayLines = result;
		} catch (e) {
			error = String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="full-file-diff">
	<DiffHeader {file} />
	{#if loading}
		<div class="status">Loading…</div>
	{:else if error}
		<div class="status error">{error}</div>
	{:else}
		<table class="diff-table">
			<tbody>
				{#each displayLines as line, i}
					<DiffLineRow {line} highlighted={highlightedLines[i]} />
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.full-file-diff {
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
	}
	.diff-table {
		width: 100%;
		border-collapse: collapse;
	}
	.status {
		padding: 24px;
		text-align: center;
		color: var(--text-muted);
		font-size: 1rem;
	}
	.status.error {
		color: var(--color-del);
		background: var(--diff-del-bg);
		padding: 16px;
		text-align: left;
	}
</style>
