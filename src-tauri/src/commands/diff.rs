use crate::commands::git_blocking;
use crate::git::{diff, repo as git_repo, types::*};
use diff::DiffOpts;

fn opts(ignore_whitespace: bool) -> DiffOpts {
    DiffOpts { ignore_whitespace }
}

fn build_summary(files: Vec<FileSummary>) -> DiffSummary {
    let total_additions = files.iter().map(|f| f.additions).sum();
    let total_deletions = files.iter().map(|f| f.deletions).sum();
    DiffSummary { files, total_additions, total_deletions }
}

#[tauri::command]
pub async fn get_diff_summary(
    path: String,
    from_ref: String,
    to_ref: String,
    ignore_whitespace: bool,
) -> Result<DiffSummary, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        let files = diff::diff_branches(&repository, &from_ref, &to_ref, opts(ignore_whitespace))?;
        Ok(build_summary(files))
    })
    .await
}

#[tauri::command]
pub async fn get_file_diff(
    path: String,
    from_ref: String,
    to_ref: String,
    file_path: String,
    ignore_whitespace: bool,
) -> Result<FileDiff, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        diff::diff_file_between(&repository, &from_ref, &to_ref, &file_path, opts(ignore_whitespace))
    })
    .await
}

#[tauri::command]
pub async fn get_workdir_summary(
    path: String,
    ignore_whitespace: bool,
) -> Result<DiffSummary, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        let files = diff::diff_workdir(&repository, opts(ignore_whitespace))?;
        Ok(build_summary(files))
    })
    .await
}

#[tauri::command]
pub async fn get_workdir_file_diff(
    path: String,
    file_path: String,
    ignore_whitespace: bool,
) -> Result<FileDiff, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        diff::diff_workdir_file(&repository, &file_path, opts(ignore_whitespace))
    })
    .await
}

#[tauri::command]
pub async fn get_staged_summary(
    path: String,
    ignore_whitespace: bool,
) -> Result<DiffSummary, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        let files = diff::diff_staged(&repository, opts(ignore_whitespace))?;
        Ok(build_summary(files))
    })
    .await
}

#[tauri::command]
pub async fn get_staged_file_diff(
    path: String,
    file_path: String,
    ignore_whitespace: bool,
) -> Result<FileDiff, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        diff::diff_staged_file(&repository, &file_path, opts(ignore_whitespace))
    })
    .await
}

#[tauri::command]
pub async fn get_unstaged_summary(
    path: String,
    ignore_whitespace: bool,
) -> Result<DiffSummary, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        let files = diff::diff_unstaged(&repository, opts(ignore_whitespace))?;
        Ok(build_summary(files))
    })
    .await
}

#[tauri::command]
pub async fn get_unstaged_file_diff(
    path: String,
    file_path: String,
    ignore_whitespace: bool,
) -> Result<FileDiff, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        diff::diff_unstaged_file(&repository, &file_path, opts(ignore_whitespace))
    })
    .await
}

#[tauri::command]
pub async fn get_branch_to_workdir_summary(
    path: String,
    base_ref: String,
    ignore_whitespace: bool,
) -> Result<DiffSummary, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        let files = diff::diff_branch_to_workdir(&repository, &base_ref, opts(ignore_whitespace))?;
        Ok(build_summary(files))
    })
    .await
}

#[tauri::command]
pub async fn get_branch_to_workdir_file_diff(
    path: String,
    base_ref: String,
    file_path: String,
    ignore_whitespace: bool,
) -> Result<FileDiff, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        diff::diff_branch_to_workdir_file(&repository, &base_ref, &file_path, opts(ignore_whitespace))
    })
    .await
}

#[tauri::command]
pub async fn get_file_content(path: String, ref_name: String, file_path: String) -> Result<Vec<String>, String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        diff::get_file_content(&repository, &ref_name, &file_path)
    })
    .await
}

#[tauri::command]
pub async fn get_local_vs_remote(path: String) -> Result<(DiffSummary, String, String), String> {
    git_blocking(move || {
        let repository = git_repo::open_repo(&path)?;
        let (files, upstream, branch) = diff::diff_local_vs_remote(&repository)?;
        Ok((build_summary(files), upstream, branch))
    })
    .await
}
