<script lang="ts">
	import type { FileDiff } from '$lib/services/git';
	import { getFileBytes } from '$lib/services/git';
	import { diffStore } from '$lib/stores/diff.svelte';
	import { repoStore } from '$lib/stores/repo.svelte';
	import DiffHeader from './DiffHeader.svelte';

	interface Props {
		file: FileDiff;
	}

	let { file }: Props = $props();

	let beforeUrl = $state<string | null>(null);
	let afterUrl = $state<string | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		file;
		load();
	});

	async function load() {
		loading = true;
		error = '';
		beforeUrl = null;
		afterUrl = null;
		try {
			const baseRef = diffStore.toRef || 'HEAD';
			const beforePath = file.old_path ?? file.path;

			const tasks: Promise<void>[] = [];
			if (file.status !== 'Added') {
				tasks.push(
					getFileBytes(repoStore.path, baseRef, beforePath).then((b) => {
						beforeUrl = `data:${b.mime};base64,${b.base64}`;
					})
				);
			}
			if (file.status !== 'Deleted') {
				tasks.push(
					getFileBytes(repoStore.path, '', file.path).then((b) => {
						afterUrl = `data:${b.mime};base64,${b.base64}`;
					})
				);
			}
			await Promise.all(tasks);
		} catch (e) {
			error = String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="image-diff">
	<DiffHeader {file} />
	{#if loading}
		<div class="status">Loading…</div>
	{:else if error}
		<div class="status error">{error}</div>
	{:else}
		<div class="image-grid" class:single={!beforeUrl || !afterUrl}>
			{#if beforeUrl}
				<figure class="image-pane before">
					<figcaption>Before</figcaption>
					<div class="image-frame">
						<img src={beforeUrl} alt="before" />
					</div>
				</figure>
			{/if}
			{#if afterUrl}
				<figure class="image-pane after">
					<figcaption>After</figcaption>
					<div class="image-frame">
						<img src={afterUrl} alt="after" />
					</div>
				</figure>
			{/if}
		</div>
	{/if}
</div>

<style>
	.image-diff {
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
		width: 100%;
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
	.image-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: var(--border);
	}
	.image-grid.single {
		grid-template-columns: 1fr;
	}
	.image-pane {
		margin: 0;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
	}
	figcaption {
		font-family: var(--font-mono);
		font-size: 0.786rem;
		color: var(--text-muted);
		padding: 6px 12px;
		border-bottom: 1px solid var(--border);
	}
	.before figcaption {
		background: var(--diff-del-bg);
		color: var(--color-del);
	}
	.after figcaption {
		background: var(--diff-add-bg);
		color: var(--color-add);
	}
	.image-frame {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		background-color: var(--bg-secondary);
		background-image:
			linear-gradient(45deg, var(--border) 25%, transparent 25%),
			linear-gradient(-45deg, var(--border) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--border) 75%),
			linear-gradient(-45deg, transparent 75%, var(--border) 75%);
		background-size: 16px 16px;
		background-position: 0 0, 0 8px, 8px -8px, -8px 0;
		min-height: 120px;
	}
	img {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
		display: block;
	}
</style>
