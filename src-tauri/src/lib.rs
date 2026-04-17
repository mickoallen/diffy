mod ai;
mod commands;
mod git;
mod watcher;

use commands::{ai as ai_cmds, diff as diff_cmds, git as git_cmds, watcher as watcher_cmds};
use commands::git::AssetScopeState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(watcher::WatcherState::new())
        .manage(AssetScopeState::default())
        .setup(|app| {
            // Force the main window to grab focus on launch (macOS workaround).
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Git commands
            git_cmds::open_repo,
            git_cmds::get_remote_url,
            git_cmds::list_branches,
            git_cmds::get_default_branch,
            git_cmds::get_commits_between,
            git_cmds::list_repo_files,
            git_cmds::read_repo_file,
            // Diff commands
            diff_cmds::get_diff_summary,
            diff_cmds::get_file_diff,
            diff_cmds::get_workdir_summary,
            diff_cmds::get_workdir_file_diff,
            diff_cmds::get_staged_summary,
            diff_cmds::get_staged_file_diff,
            diff_cmds::get_unstaged_summary,
            diff_cmds::get_unstaged_file_diff,
            diff_cmds::get_branch_to_workdir_summary,
            diff_cmds::get_branch_to_workdir_file_diff,
            diff_cmds::get_local_vs_remote,
            diff_cmds::get_file_content,
            diff_cmds::get_file_bytes,
            // AI commands
            ai_cmds::ai_summarize,
            ai_cmds::ai_flag_issues,
            ai_cmds::ai_explain_hunk,
            ai_cmds::list_ai_models,
            ai_cmds::test_ai_connection,
            // Watcher commands
            watcher_cmds::start_watching,
            watcher_cmds::stop_watching,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
