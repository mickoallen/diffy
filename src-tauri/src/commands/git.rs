use crate::commands::git_blocking;
use crate::git::{repo, types::*};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

/// Tracks the currently-scoped repository root for the asset protocol.
/// When a new repo is opened, the previous root is revoked and the new root allowed.
#[derive(Default)]
pub struct AssetScopeState {
    current: Mutex<Option<PathBuf>>,
}

/// Canonicalise `root` and `root.join(rel)` (or canonicalise `root` alone if `rel` is empty),
/// and verify the resolved path stays inside the canonical root. Rejects path traversal
/// and symlinks that escape the repo.
pub(crate) fn resolve_within(root: &str, rel: &str) -> Result<PathBuf, String> {
    let canonical_root = std::fs::canonicalize(root)
        .map_err(|e| format!("Failed to resolve repository root: {}", e))?;

    let target = if rel.is_empty() {
        canonical_root.clone()
    } else {
        canonical_root.join(rel)
    };

    let canonical_target = std::fs::canonicalize(&target)
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    if !canonical_target.starts_with(&canonical_root) {
        return Err("path escapes repository root".to_string());
    }

    Ok(canonical_target)
}

#[tauri::command]
pub async fn open_repo(
    app: AppHandle,
    scope_state: State<'_, AssetScopeState>,
    path: String,
) -> Result<String, String> {
    let repo_path = git_blocking(move || {
        let repository = repo::open_repo(&path)?;
        Ok(repo::get_repo_path(&repository))
    })
    .await?;

    // Narrow the asset protocol scope to the just-opened repo only.
    let canonical = std::fs::canonicalize(&repo_path)
        .map_err(|e| format!("Failed to resolve repository root: {}", e))?;

    let asset_scope = app.asset_protocol_scope();
    let mut current = scope_state
        .current
        .lock()
        .map_err(|_| "asset scope mutex poisoned".to_string())?;

    if let Some(prev) = current.as_ref() {
        if prev != &canonical {
            let _ = asset_scope.forbid_directory(prev, true);
        }
    }

    asset_scope
        .allow_directory(&canonical, true)
        .map_err(|e| format!("Failed to scope asset protocol: {}", e))?;

    *current = Some(canonical);
    Ok(repo_path)
}

#[tauri::command]
pub async fn get_remote_url(path: String) -> Result<String, String> {
    git_blocking(move || {
        let repository = repo::open_repo(&path)?;
        Ok(repo::get_remote_url(&repository))
    })
    .await
}

#[tauri::command]
pub async fn list_branches(path: String) -> Result<Vec<BranchInfo>, String> {
    git_blocking(move || {
        let repository = repo::open_repo(&path)?;
        repo::list_branches(&repository)
    })
    .await
}

#[tauri::command]
pub async fn get_default_branch(path: String) -> Result<String, String> {
    git_blocking(move || {
        let repository = repo::open_repo(&path)?;
        Ok(repo::get_default_branch(&repository))
    })
    .await
}

#[tauri::command]
pub async fn get_commits_between(
    path: String,
    from_ref: String,
    to_ref: String,
) -> Result<Vec<CommitInfo>, String> {
    git_blocking(move || {
        let repository = repo::open_repo(&path)?;
        repo::get_commits_between(&repository, &from_ref, &to_ref)
    })
    .await
}

#[tauri::command]
pub async fn list_repo_files(path: String) -> Result<Vec<String>, String> {
    git_blocking(move || {
        let root = resolve_within(&path, "")?;
        let mut files = Vec::new();
        walk_dir(&root, &root, &mut files)?;
        files.sort();
        Ok(files)
    })
    .await
}

fn walk_dir(root: &Path, dir: &Path, files: &mut Vec<String>) -> Result<(), String> {
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with('.') || name_str == "node_modules" || name_str == "target" {
            continue;
        }
        // Reject entries that resolve outside the root (symlink escapes).
        let canonical = match std::fs::canonicalize(&path) {
            Ok(c) => c,
            Err(_) => continue,
        };
        if !canonical.starts_with(root) {
            continue;
        }
        if canonical.is_dir() {
            walk_dir(root, &canonical, files)?;
        } else if let Ok(rel) = canonical.strip_prefix(root) {
            files.push(rel.to_string_lossy().to_string());
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn read_repo_file(path: String, file_path: String) -> Result<String, String> {
    git_blocking(move || {
        let full_path = resolve_within(&path, &file_path)?;
        std::fs::read_to_string(&full_path).map_err(|e| e.to_string())
    })
    .await
}
