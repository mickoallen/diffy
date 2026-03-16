use crate::git::{diff, repo, types::*};

#[tauri::command]
pub fn get_diff_summary(
    path: String,
    from_ref: String,
    to_ref: String,
) -> Result<DiffSummary, String> {
    let repository = repo::open_repo(&path)?;
    let files = diff::diff_branches(&repository, &from_ref, &to_ref)?;
    let total_additions = files.iter().map(|f| f.additions).sum();
    let total_deletions = files.iter().map(|f| f.deletions).sum();
    Ok(DiffSummary {
        files,
        total_additions,
        total_deletions,
    })
}

#[tauri::command]
pub fn get_file_diff(
    path: String,
    from_ref: String,
    to_ref: String,
    file_path: String,
) -> Result<FileDiff, String> {
    let repository = repo::open_repo(&path)?;
    diff::diff_file_between(&repository, &from_ref, &to_ref, &file_path)
}

#[tauri::command]
pub fn get_workdir_summary(path: String) -> Result<DiffSummary, String> {
    let repository = repo::open_repo(&path)?;
    let files = diff::diff_workdir(&repository)?;
    let total_additions = files.iter().map(|f| f.additions).sum();
    let total_deletions = files.iter().map(|f| f.deletions).sum();
    Ok(DiffSummary {
        files,
        total_additions,
        total_deletions,
    })
}

#[tauri::command]
pub fn get_workdir_file_diff(path: String, file_path: String) -> Result<FileDiff, String> {
    let repository = repo::open_repo(&path)?;
    diff::diff_workdir_file(&repository, &file_path)
}

#[tauri::command]
pub fn get_file_content(path: String, ref_name: String, file_path: String) -> Result<Vec<String>, String> {
    let repository = repo::open_repo(&path)?;
    diff::get_file_content(&repository, &ref_name, &file_path)
}

#[tauri::command]
pub fn get_local_vs_remote(path: String) -> Result<(DiffSummary, String, String), String> {
    let repository = repo::open_repo(&path)?;
    let (files, upstream, branch) = diff::diff_local_vs_remote(&repository)?;
    let total_additions = files.iter().map(|f| f.additions).sum();
    let total_deletions = files.iter().map(|f| f.deletions).sum();
    Ok((
        DiffSummary {
            files,
            total_additions,
            total_deletions,
        },
        upstream,
        branch,
    ))
}
