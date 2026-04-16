use serde::{Deserialize, Serialize};

use super::types::AiConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiRequest {
    pub prompt: String,
    pub context: String,
    pub mode: AiMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AiMode {
    Summarize,
    FlagIssues,
    ExplainHunk,
}

// --- Claude types ---

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<ClaudeMessage>,
    system: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeContentBlock {
    #[serde(rename = "type")]
    content_type: String,
    text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContentBlock>,
}

// --- OpenAI-compatible types (used for OpenAI, Ollama, LM Studio) ---

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<OaiMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiChoice {
    message: OaiMessage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OaiResponse {
    choices: Vec<OaiChoice>,
}

// --- Gemini types ---

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
    #[serde(skip_serializing_if = "Option::is_none")]
    role: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    system_instruction: GeminiContent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

fn system_prompt(mode: &AiMode) -> &'static str {
    match mode {
        AiMode::Summarize => {
            "You are a code review assistant. Summarize the following diff concisely, \
             highlighting the key changes, their purpose, and any notable patterns."
        }
        AiMode::FlagIssues => {
            "You are a code review assistant. Review the following diff and flag any \
             potential issues: bugs, security concerns, performance problems, or code smells. \
             Be specific and actionable."
        }
        AiMode::ExplainHunk => {
            "You are a code review assistant. Explain what this code change does in plain \
             language. Focus on the intent and impact of the change."
        }
    }
}

async fn call_claude(api_key: &str, model: &str, system: &str, user_content: &str) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let body = ClaudeRequest {
        model: model.to_string(),
        max_tokens: 1024,
        messages: vec![ClaudeMessage {
            role: "user".to_string(),
            content: user_content.to_string(),
        }],
        system: system.to_string(),
    };

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = match resp.text().await {
            Ok(t) => t,
            Err(e) => format!("<failed to read error body: {}>", e),
        };
        return Err(format!("API error {}: {}", status, text));
    }

    let r: ClaudeResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(r.content.into_iter().filter_map(|b| b.text).collect::<Vec<_>>().join(""))
}

async fn call_openai_compat(base_url: &str, api_key: &str, model: &str, system: &str, user_content: &str) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let url = format!("{}/v1/chat/completions", base_url.trim_end_matches('/'));
    let body = OaiRequest {
        model: model.to_string(),
        max_tokens: 1024,
        messages: vec![
            OaiMessage { role: "system".to_string(), content: system.to_string() },
            OaiMessage { role: "user".to_string(), content: user_content.to_string() },
        ],
    };

    let mut req = client.post(&url).header("content-type", "application/json");
    if !api_key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", api_key));
    }
    let resp = req.json(&body).send().await.map_err(|e| format!("API request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = match resp.text().await {
            Ok(t) => t,
            Err(e) => format!("<failed to read error body: {}>", e),
        };
        return Err(format!("API error {}: {}", status, text));
    }

    let r: OaiResponse = resp.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(r.choices.into_iter().next().map(|c| c.message.content).unwrap_or_default())
}

async fn call_gemini(api_key: &str, model: &str, system: &str, user_content: &str) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );
    let body = GeminiRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart { text: user_content.to_string() }],
            role: Some("user".to_string()),
        }],
        system_instruction: GeminiContent {
            parts: vec![GeminiPart { text: system.to_string() }],
            role: None,
        },
    };

    let resp = client
        .post(&url)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = match resp.text().await {
            Ok(t) => t,
            Err(e) => format!("<failed to read error body: {}>", e),
        };
        return Err(format!("API error {}: {}", status, text));
    }

    let r: GeminiResponse = resp.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(r.candidates
        .into_iter()
        .next()
        .and_then(|c| c.content.parts.into_iter().next())
        .map(|p| p.text)
        .unwrap_or_default())
}

pub async fn call_ai(config: &AiConfig, request: &AiRequest) -> Result<String, String> {
    let system = system_prompt(&request.mode);
    let user_content = format!("{}\n\n```diff\n{}\n```", request.prompt, request.context);

    match config.provider.as_str() {
        "claude" => call_claude(&config.api_key, &config.model, system, &user_content).await,
        "openai" => {
            call_openai_compat("https://api.openai.com", &config.api_key, &config.model, system, &user_content).await
        }
        "gemini" => call_gemini(&config.api_key, &config.model, system, &user_content).await,
        "ollama" => {
            let base_url = if config.base_url.is_empty() { "http://localhost:11434" } else { &config.base_url };
            call_openai_compat(base_url, &config.api_key, &config.model, system, &user_content).await
        }
        "lmstudio" => {
            let base_url = if config.base_url.is_empty() { "http://localhost:1234" } else { &config.base_url };
            call_openai_compat(base_url, &config.api_key, &config.model, system, &user_content).await
        }
        other => Err(format!("Unknown AI provider: {}", other)),
    }
}
