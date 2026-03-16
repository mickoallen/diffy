use git2::Repository;
use std::path::Path;

use super::types::{BranchInfo, CommitInfo};

pub fn open_repo(path: &str) -> Result<Repository, String> {
    Repository::discover(path).map_err(|e| format!("Failed to open repository: {}", e))
}

pub fn list_branches(repo: &Repository) -> Result<Vec<BranchInfo>, String> {
    let mut branches = Vec::new();
    let head = repo.head().ok();
    let head_name = head
        .as_ref()
        .and_then(|h| h.shorthand().map(|s| s.to_string()));

    let git_branches = repo
        .branches(Some(git2::BranchType::Local))
        .map_err(|e| format!("Failed to list branches: {}", e))?;

    for branch in git_branches {
        let (branch, _) = branch.map_err(|e| format!("Failed to read branch: {}", e))?;
        let name = branch
            .name()
            .map_err(|e| format!("Invalid branch name: {}", e))?
            .unwrap_or("unknown")
            .to_string();

        let upstream = branch
            .upstream()
            .ok()
            .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

        let is_head = head_name.as_deref() == Some(&name);

        branches.push(BranchInfo {
            name,
            is_head,
            upstream,
        });
    }

    // Sort: HEAD first, then alphabetical
    branches.sort_by(|a, b| b.is_head.cmp(&a.is_head).then(a.name.cmp(&b.name)));
    Ok(branches)
}

pub fn get_commits_between(
    repo: &Repository,
    from_ref: &str,
    to_ref: &str,
) -> Result<Vec<CommitInfo>, String> {
    let from_obj = repo
        .revparse_single(from_ref)
        .map_err(|e| format!("Failed to resolve '{}': {}", from_ref, e))?;
    let to_obj = repo
        .revparse_single(to_ref)
        .map_err(|e| format!("Failed to resolve '{}': {}", to_ref, e))?;

    let mut revwalk = repo
        .revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;

    revwalk
        .push(to_obj.id())
        .map_err(|e| format!("Failed to push to revwalk: {}", e))?;
    revwalk
        .hide(from_obj.id())
        .map_err(|e| format!("Failed to hide from revwalk: {}", e))?;

    let mut commits = Vec::new();
    for oid in revwalk {
        let oid = oid.map_err(|e| format!("Revwalk error: {}", e))?;
        let commit = repo
            .find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        commits.push(CommitInfo {
            id: oid.to_string(),
            summary: commit.summary().unwrap_or("").to_string(),
            author: commit.author().name().unwrap_or("unknown").to_string(),
            time: commit.time().seconds(),
        });
    }

    Ok(commits)
}

pub fn get_repo_path(repo: &Repository) -> String {
    repo.workdir()
        .unwrap_or_else(|| Path::new(""))
        .to_string_lossy()
        .to_string()
}
