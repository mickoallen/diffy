mod ai;
mod commands;
mod git;

use commands::{ai as ai_cmds, diff as diff_cmds, git as git_cmds};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // Git commands
            git_cmds::open_repo,
            git_cmds::list_branches,
            git_cmds::get_commits_between,
            git_cmds::list_repo_files,
            git_cmds::read_repo_file,
            // Diff commands
            diff_cmds::get_diff_summary,
            diff_cmds::get_file_diff,
            diff_cmds::get_workdir_summary,
            diff_cmds::get_workdir_file_diff,
            diff_cmds::get_local_vs_remote,
            // AI commands
            ai_cmds::ai_summarize,
            ai_cmds::ai_flag_issues,
            ai_cmds::ai_explain_hunk,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
