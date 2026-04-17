use crate::commands::git_blocking;
use crate::commands::git::resolve_within;
use crate::git::{diff, repo as git_repo, types::*};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use diff::DiffOpts;

#[derive(serde::Serialize)]
pub struct FileBytes {
    pub base64: String,
    pub mime: String,
}

fn mime_from_path(path: &str) -> String {
    let ext = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",
        "avif" => "image/avif",
        _ => "application/octet-stream",
    }
    .to_string()
}

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

/// Returns the raw bytes of a file as base64. If `ref_name` is empty, reads the working
/// copy from disk; otherwise resolves the file from a git tree at that ref.
#[tauri::command]
pub async fn get_file_bytes(
    path: String,
    ref_name: String,
    file_path: String,
) -> Result<FileBytes, String> {
    git_blocking(move || {
        let mime = mime_from_path(&file_path);
        let bytes = if ref_name.is_empty() {
            let full = resolve_within(&path, &file_path)?;
            let len = std::fs::metadata(&full)
                .map_err(|e| e.to_string())?
                .len() as usize;
            if len > diff::MAX_BINARY_BYTES {
                return Err(format!("file too large: {} bytes", len));
            }
            std::fs::read(&full).map_err(|e| e.to_string())?
        } else {
            let repository = git_repo::open_repo(&path)?;
            diff::get_file_bytes_at_ref(&repository, &ref_name, &file_path)?
        };
        Ok(FileBytes {
            base64: STANDARD.encode(bytes),
            mime,
        })
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
