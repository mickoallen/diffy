use crate::ai::client::{self, AiMode, AiRequest};

#[tauri::command]
pub async fn ai_summarize(api_key: String, diff_content: String) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Summarize this diff:".to_string(),
        context: diff_content,
        mode: AiMode::Summarize,
    };
    client::call_claude(&api_key, &request).await
}

#[tauri::command]
pub async fn ai_flag_issues(api_key: String, diff_content: String) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Review this diff for issues:".to_string(),
        context: diff_content,
        mode: AiMode::FlagIssues,
    };
    client::call_claude(&api_key, &request).await
}

#[tauri::command]
pub async fn ai_explain_hunk(api_key: String, hunk_content: String) -> Result<String, String> {
    let request = AiRequest {
        prompt: "Explain this code change:".to_string(),
        context: hunk_content,
        mode: AiMode::ExplainHunk,
    };
    client::call_claude(&api_key, &request).await
}
