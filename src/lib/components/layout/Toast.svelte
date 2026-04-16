<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
</script>

<div class="toast-region" role="status" aria-live="polite">
	{#each toastStore.toasts as t (t.id)}
		<button type="button" class="toast {t.kind}" onclick={() => toastStore.dismiss(t.id)}>
			<span class="msg">{t.message}</span>
			<span class="close" aria-hidden="true">×</span>
		</button>
	{/each}
</div>

<style>
	.toast-region {
		position: fixed;
		bottom: 16px;
		right: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 10000;
		pointer-events: none;
		max-width: 420px;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 0.786rem;
		text-align: left;
		cursor: pointer;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
	.toast.error {
		border-color: var(--color-deleted, #f85149);
		color: var(--color-deleted, #f85149);
	}
	.msg {
		flex: 1;
		word-break: break-word;
		white-space: pre-wrap;
	}
	.close {
		color: var(--text-muted);
		font-size: 1rem;
		line-height: 1;
	}
	.toast:hover .close {
		color: var(--text-primary);
	}
</style>
