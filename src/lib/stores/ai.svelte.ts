import { aiSummarize, aiFlagIssues, aiExplainHunk } from '$lib/services/ai';
import { settingsStore } from './settings.svelte';

class AiStore {
	summary = $state('');
	issues = $state('');
	hunkExplanation = $state('');
	loading = $state(false);
	error = $state('');

	async summarize(diffContent: string) {
		if (!settingsStore.apiKey) {
			this.error = 'API key not configured';
			return;
		}
		this.loading = true;
		this.error = '';
		try {
			this.summary = await aiSummarize(settingsStore.apiKey, diffContent);
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	async flagIssues(diffContent: string) {
		if (!settingsStore.apiKey) {
			this.error = 'API key not configured';
			return;
		}
		this.loading = true;
		this.error = '';
		try {
			this.issues = await aiFlagIssues(settingsStore.apiKey, diffContent);
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	async explainHunk(hunkContent: string) {
		if (!settingsStore.apiKey) {
			this.error = 'API key not configured';
			return;
		}
		this.loading = true;
		this.error = '';
		try {
			this.hunkExplanation = await aiExplainHunk(settingsStore.apiKey, hunkContent);
		} catch (e) {
			this.error = String(e);
		} finally {
			this.loading = false;
		}
	}

	clear() {
		this.summary = '';
		this.issues = '';
		this.hunkExplanation = '';
		this.error = '';
	}
}

export const aiStore = new AiStore();
