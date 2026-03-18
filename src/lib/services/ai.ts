import { invoke } from '@tauri-apps/api/core';

export interface AiConfig {
	provider: string;
	apiKey: string;
	model: string;
	baseUrl: string;
}

export async function aiSummarize(config: AiConfig, diffContent: string): Promise<string> {
	return invoke('ai_summarize', { config: toRustConfig(config), diffContent });
}

export async function aiFlagIssues(config: AiConfig, diffContent: string): Promise<string> {
	return invoke('ai_flag_issues', { config: toRustConfig(config), diffContent });
}

export async function aiExplainHunk(config: AiConfig, hunkContent: string): Promise<string> {
	return invoke('ai_explain_hunk', { config: toRustConfig(config), hunkContent });
}

export async function listAiModels(provider: string, apiKey: string, baseUrl: string): Promise<string[]> {
	return invoke('list_ai_models', { provider, apiKey, baseUrl });
}

export async function testAiConnection(config: AiConfig): Promise<string> {
	return invoke('test_ai_connection', { config: toRustConfig(config) });
}

function toRustConfig(config: AiConfig) {
	return {
		provider: config.provider,
		api_key: config.apiKey,
		model: config.model,
		base_url: config.baseUrl
	};
}
