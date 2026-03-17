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
        .branches(None) // None = local + remote
        .map_err(|e| format!("Failed to list branches: {}", e))?;

    for branch in git_branches {
        let (branch, branch_type) = branch.map_err(|e| format!("Failed to read branch: {}", e))?;
        let name = branch
            .name()
            .map_err(|e| format!("Invalid branch name: {}", e))?
            .unwrap_or("unknown")
            .to_string();

        // Skip origin/HEAD remote pointer
        if name.ends_with("/HEAD") {
            continue;
        }

        let is_remote = branch_type == git2::BranchType::Remote;
        let upstream = if !is_remote {
            branch
                .upstream()
                .ok()
                .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()))
        } else {
            None
        };

        let is_head = !is_remote && head_name.as_deref() == Some(&name);

        branches.push(BranchInfo {
            name,
            is_head,
            is_remote,
            upstream,
        });
    }

    // Sort: HEAD first, then local branches, then remote branches, all alphabetical
    branches.sort_by(|a, b| {
        b.is_head.cmp(&a.is_head)
            .then(a.is_remote.cmp(&b.is_remote))
            .then(a.name.cmp(&b.name))
    });
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

/// Returns the name of the default branch (e.g. "main"), preferring origin/HEAD,
/// falling back to common local branch names.
pub fn get_default_branch(repo: &Repository) -> String {
    // Try origin/HEAD → "refs/remotes/origin/main" etc.
    if let Ok(reference) = repo.find_reference("refs/remotes/origin/HEAD") {
        if let Some(target) = reference.symbolic_target() {
            if let Some(branch) = target.strip_prefix("refs/remotes/origin/") {
                return branch.to_string();
            }
        }
    }
    // Fall back to common default branch names
    for name in &["main", "master", "develop"] {
        if repo.find_branch(name, git2::BranchType::Local).is_ok() {
            return name.to_string();
        }
    }
    String::new()
}

/// Returns the HTTPS URL derived from the "origin" remote, or an empty string if unavailable.
pub fn get_remote_url(repo: &Repository) -> String {
    let url = repo
        .find_remote("origin")
        .ok()
        .and_then(|r| r.url().map(|s| s.to_string()))
        .unwrap_or_default();
    // Convert SSH URLs like git@github.com:user/repo.git to HTTPS
    if let Some(rest) = url.strip_prefix("git@") {
        let rest = rest.replacen(':', "/", 1);
        let rest = rest.strip_suffix(".git").unwrap_or(&rest);
        return format!("https://{rest}");
    }
    url.strip_suffix(".git").unwrap_or(&url).to_string()
}

pub fn get_repo_path(repo: &Repository) -> String {
    repo.workdir()
        .unwrap_or_else(|| Path::new(""))
        .to_string_lossy()
        .to_string()
}
