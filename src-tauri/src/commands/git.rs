use crate::git::{repo, types::*};

#[tauri::command]
pub async fn open_repo(path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let repository = repo::open_repo(&path)?;
        Ok(repo::get_repo_path(&repository))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_remote_url(path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let repository = repo::open_repo(&path)?;
        Ok(repo::get_remote_url(&repository))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_branches(path: String) -> Result<Vec<BranchInfo>, String> {
    tokio::task::spawn_blocking(move || {
        let repository = repo::open_repo(&path)?;
        repo::list_branches(&repository)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_default_branch(path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let repository = repo::open_repo(&path)?;
        Ok(repo::get_default_branch(&repository))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_commits_between(
    path: String,
    from_ref: String,
    to_ref: String,
) -> Result<Vec<CommitInfo>, String> {
    tokio::task::spawn_blocking(move || {
        let repository = repo::open_repo(&path)?;
        repo::get_commits_between(&repository, &from_ref, &to_ref)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_repo_files(path: String) -> Result<Vec<String>, String> {
    tokio::task::spawn_blocking(move || {
        let root = std::path::Path::new(&path).to_path_buf();
        let mut files = Vec::new();
        walk_dir(&root, &root, &mut files)?;
        files.sort();
        Ok(files)
    }).await.map_err(|e| e.to_string())?
}

fn walk_dir(root: &std::path::Path, dir: &std::path::Path, files: &mut Vec<String>) -> Result<(), String> {
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with('.') || name_str == "node_modules" || name_str == "target" {
            continue;
        }
        if path.is_dir() {
            walk_dir(root, &path, files)?;
        } else {
            if let Ok(rel) = path.strip_prefix(root) {
                files.push(rel.to_string_lossy().to_string());
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn read_repo_file(path: String, file_path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let full_path = std::path::Path::new(&path).join(&file_path);
        std::fs::read_to_string(&full_path).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}
