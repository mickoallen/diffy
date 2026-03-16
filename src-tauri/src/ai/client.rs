use serde::{Deserialize, Serialize};

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

pub async fn call_claude(api_key: &str, request: &AiRequest) -> Result<String, String> {
    let system_prompt = match request.mode {
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
    };

    let client = reqwest::Client::new();
    let body = ClaudeRequest {
        model: "claude-sonnet-4-6".to_string(),
        max_tokens: 1024,
        messages: vec![ClaudeMessage {
            role: "user".to_string(),
            content: format!("{}\n\n```diff\n{}\n```", request.prompt, request.context),
        }],
        system: system_prompt.to_string(),
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
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    let claude_resp: ClaudeResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(claude_resp
        .content
        .into_iter()
        .filter_map(|b| b.text)
        .collect::<Vec<_>>()
        .join(""))
}
