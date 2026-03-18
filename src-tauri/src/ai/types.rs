use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub provider: String, // "claude" | "openai" | "gemini" | "ollama" | "lmstudio"
    pub api_key: String,
    pub model: String,
    pub base_url: String, // populated for ollama/lmstudio; empty string otherwise
}
