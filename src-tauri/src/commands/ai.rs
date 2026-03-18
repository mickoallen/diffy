use crate::ai::client::{AiMode, AiRequest};
use crate::ai::types::AiConfig;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaModel {
    name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiModelsResponse {
    data: Vec<OaiModel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiModel {
    id: String,
}

#[tauri::command]
pub async fn ai_summarize(config: AiConfig, diff_content: String) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Summarize this diff:".to_string(),
        context: diff_content,
        mode: AiMode::Summarize,
    };
    crate::ai::client::call_ai(&config, &request).await
}

#[tauri::command]
pub async fn ai_flag_issues(config: AiConfig, diff_content: String) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Review this diff for issues:".to_string(),
        context: diff_content,
        mode: AiMode::FlagIssues,
    };
    crate::ai::client::call_ai(&config, &request).await
}

#[tauri::command]
pub async fn ai_explain_hunk(config: AiConfig, hunk_content: String) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Explain this code change:".to_string(),
        context: hunk_content,
        mode: AiMode::ExplainHunk,
    };
    crate::ai::client::call_ai(&config, &request).await
}

#[tauri::command]
pub async fn list_ai_models(provider: String, api_key: String, base_url: String) -> Result<Vec<String>, String> {
    match provider.as_str() {
        "claude" => Ok(vec![
            "claude-opus-4-6".to_string(),
            "claude-sonnet-4-6".to_string(),
            "claude-haiku-4-5-20251001".to_string(),
        ]),
        "openai" => Ok(vec![
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
            "gpt-4-turbo".to_string(),
            "o1".to_string(),
            "o3-mini".to_string(),
        ]),
        "gemini" => Ok(vec![
            "gemini-2.5-pro".to_string(),
            "gemini-2.0-flash".to_string(),
            "gemini-1.5-pro".to_string(),
        ]),
        "ollama" => {
            let base = if base_url.is_empty() { "http://localhost:11434".to_string() } else { base_url };
            let url = format!("{}/api/tags", base.trim_end_matches('/'));
            let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(10)).build().map_err(|e| e.to_string())?;
            let resp = client
                .get(&url)
                .send()
                .await
                .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;
            if !resp.status().is_success() {
                return Err(format!("Ollama error: {}", resp.status()));
            }
            let data: OllamaTagsResponse = resp.json().await.map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
            Ok(data.models.into_iter().map(|m| m.name).collect())
        }
        "lmstudio" => {
            let base = if base_url.is_empty() { "http://localhost:1234".to_string() } else { base_url };
            let url = format!("{}/v1/models", base.trim_end_matches('/'));
            let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(10)).build().map_err(|e| e.to_string())?;
            let mut req = client.get(&url);
            if !api_key.is_empty() {
                req = req.header("Authorization", format!("Bearer {}", api_key));
            }
            let resp = req.send().await.map_err(|e| format!("Failed to connect to LM Studio: {}", e))?;
            if !resp.status().is_success() {
                return Err(format!("LM Studio error: {}", resp.status()));
            }
            let data: OaiModelsResponse = resp.json().await.map_err(|e| format!("Failed to parse LM Studio response: {}", e))?;
            Ok(data.data.into_iter().map(|m| m.id).collect())
        }
        other => Err(format!("Unknown provider: {}", other)),
    }
}

#[tauri::command]
pub async fn test_ai_connection(config: AiConfig) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Reply with only the word: ok".to_string(),
        context: String::new(),
        mode: AiMode::Summarize,
    };
    // Use max_tokens=1 equivalent — we just want to verify auth/connectivity
    crate::ai::client::call_ai(&config, &request).await.map(|_| "Connection successful".to_string())
}
