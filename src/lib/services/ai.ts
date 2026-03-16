import { invoke } from '@tauri-apps/api/core';

export async function aiSummarize(apiKey: string, diffContent: string): Promise<string> {
	return invoke('ai_summarize', { apiKey, diffContent });
}

export async function aiFlagIssues(apiKey: string, diffContent: string): Promise<string> {
	return invoke('ai_flag_issues', { apiKey, diffContent });
}

export async function aiExplainHunk(apiKey: string, hunkContent: string): Promise<string> {
	return invoke('ai_explain_hunk', { apiKey, hunkContent });
}
