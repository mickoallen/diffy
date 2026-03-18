use git2::{Delta, Diff, DiffOptions, Repository};

use super::types::*;

fn delta_to_status(delta: Delta) -> FileStatus {
    match delta {
        Delta::Added | Delta::Untracked => FileStatus::Added,
        Delta::Deleted => FileStatus::Deleted,
        Delta::Renamed => FileStatus::Renamed,
        _ => FileStatus::Modified,
    }
}

pub fn diff_branches(
    repo: &Repository,
    from_ref: &str,
    to_ref: &str,
) -> Result<Vec<FileSummary>, String> {
    let diff = create_tree_diff(repo, from_ref, to_ref)?;
    extract_file_summaries(&diff)
}

pub fn diff_file_between(
    repo: &Repository,
    from_ref: &str,
    to_ref: &str,
    file_path: &str,
) -> Result<FileDiff, String> {
    let from_tree = resolve_tree(repo, from_ref)?;
    let to_tree = resolve_tree(repo, to_ref)?;

    let mut opts = DiffOptions::new();
    opts.pathspec(file_path);

    let diff = repo
        .diff_tree_to_tree(Some(&from_tree), Some(&to_tree), Some(&mut opts))
        .map_err(|e| format!("Failed to diff: {}", e))?;

    extract_file_diff(&diff, file_path)
}

pub fn diff_workdir(repo: &Repository) -> Result<Vec<FileSummary>, String> {
    let head_tree = repo
        .head()
        .and_then(|h| h.peel_to_tree())
        .map_err(|e| format!("Failed to get HEAD tree: {}", e))?;

    // Staged changes (index vs HEAD)
    let staged = repo
        .diff_tree_to_index(Some(&head_tree), None, None)
        .map_err(|e| format!("Failed to diff staged: {}", e))?;

    // Unstaged + untracked changes (workdir vs index)
    let mut unstaged_opts = DiffOptions::new();
    unstaged_opts.include_untracked(true);
    unstaged_opts.recurse_untracked_dirs(true);
    unstaged_opts.show_untracked_content(true);
    let unstaged = repo
        .diff_index_to_workdir(None, Some(&mut unstaged_opts))
        .map_err(|e| format!("Failed to diff workdir: {}", e))?;

    let mut summaries = extract_file_summaries(&staged)?;
    let unstaged_summaries = extract_file_summaries(&unstaged)?;

    // Merge: prefer staged entry if same path exists
    for us in unstaged_summaries {
        if !summaries.iter().any(|s| s.path == us.path) {
            summaries.push(us);
        }
    }

    summaries.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(summaries)
}

pub fn diff_workdir_file(repo: &Repository, file_path: &str) -> Result<FileDiff, String> {
    let head_tree = repo
        .head()
        .and_then(|h| h.peel_to_tree())
        .map_err(|e| format!("Failed to get HEAD tree: {}", e))?;

    let mut opts = DiffOptions::new();
    opts.pathspec(file_path);

    // Try staged first
    let staged = repo
        .diff_tree_to_index(Some(&head_tree), None, Some(&mut opts))
        .map_err(|e| format!("Failed to diff staged: {}", e))?;

    if staged.deltas().count() > 0 {
        return extract_file_diff(&staged, file_path);
    }

    // Fall back to unstaged (including untracked)
    opts.include_untracked(true);
    opts.recurse_untracked_dirs(true);
    opts.show_untracked_content(true);
    let unstaged = repo
        .diff_index_to_workdir(None, Some(&mut opts))
        .map_err(|e| format!("Failed to diff workdir: {}", e))?;

    extract_file_diff(&unstaged, file_path)
}

/// Diff from a base branch tree to the current working directory (staged + unstaged).
/// Shows all changes (committed on current branch + uncommitted) relative to `base_ref`.
pub fn diff_branch_to_workdir(repo: &Repository, base_ref: &str) -> Result<Vec<FileSummary>, String> {
    let effective_ref = if base_ref.is_empty() { "HEAD" } else { base_ref };
    let base_tree = resolve_tree(repo, effective_ref)?;

    // Staged changes (index vs base_ref tree)
    let staged = repo
        .diff_tree_to_index(Some(&base_tree), None, None)
        .map_err(|e| format!("Failed to diff staged: {}", e))?;

    // Unstaged + untracked (workdir vs index)
    let mut unstaged_opts = DiffOptions::new();
    unstaged_opts.include_untracked(true);
    unstaged_opts.recurse_untracked_dirs(true);
    unstaged_opts.show_untracked_content(true);
    let unstaged = repo
        .diff_index_to_workdir(None, Some(&mut unstaged_opts))
        .map_err(|e| format!("Failed to diff workdir: {}", e))?;

    let mut summaries = extract_file_summaries(&staged)?;
    let unstaged_summaries = extract_file_summaries(&unstaged)?;

    for us in unstaged_summaries {
        if !summaries.iter().any(|s| s.path == us.path) {
            summaries.push(us);
        }
    }

    summaries.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(summaries)
}

pub fn diff_branch_to_workdir_file(repo: &Repository, base_ref: &str, file_path: &str) -> Result<FileDiff, String> {
    let effective_ref = if base_ref.is_empty() { "HEAD" } else { base_ref };
    let base_tree = resolve_tree(repo, effective_ref)?;

    let mut opts = DiffOptions::new();
    opts.pathspec(file_path);

    // Check staged first
    let staged = repo
        .diff_tree_to_index(Some(&base_tree), None, Some(&mut opts))
        .map_err(|e| format!("Failed to diff staged: {}", e))?;

    if staged.deltas().count() > 0 {
        return extract_file_diff(&staged, file_path);
    }

    // Fall back to unstaged
    opts.include_untracked(true);
    opts.recurse_untracked_dirs(true);
    opts.show_untracked_content(true);
    let unstaged = repo
        .diff_index_to_workdir(None, Some(&mut opts))
        .map_err(|e| format!("Failed to diff workdir: {}", e))?;

    extract_file_diff(&unstaged, file_path)
}

pub fn diff_local_vs_remote(repo: &Repository) -> Result<(Vec<FileSummary>, String, String), String> {
    let head = repo.head().map_err(|e| format!("No HEAD: {}", e))?;
    let branch_name = head.shorthand().unwrap_or("HEAD").to_string();

    let branch = repo
        .find_branch(&branch_name, git2::BranchType::Local)
        .map_err(|e| format!("Failed to find branch: {}", e))?;

    let upstream = branch
        .upstream()
        .map_err(|_| format!("No upstream tracking branch for '{}'", branch_name))?;

    let upstream_name = upstream
        .name()
        .map_err(|e| format!("Invalid upstream name: {}", e))?
        .unwrap_or("unknown")
        .to_string();

    let summaries = diff_branches(repo, &upstream_name, &branch_name)?;
    Ok((summaries, upstream_name, branch_name))
}

pub fn get_file_content(repo: &Repository, ref_name: &str, file_path: &str) -> Result<Vec<String>, String> {
    let obj = repo
        .revparse_single(ref_name)
        .map_err(|e| format!("Failed to resolve '{}': {}", ref_name, e))?;
    let tree = obj
        .peel_to_tree()
        .map_err(|e| format!("Failed to peel to tree: {}", e))?;
    let entry = tree
        .get_path(std::path::Path::new(file_path))
        .map_err(|_| format!("File '{}' not found at '{}'", file_path, ref_name))?;
    let blob = repo
        .find_blob(entry.id())
        .map_err(|e| format!("Failed to get blob: {}", e))?;
    const MAX_FILE_SIZE: usize = 2 * 1024 * 1024; // 2 MB
    if blob.is_binary() || blob.size() > MAX_FILE_SIZE {
        return Ok(vec![]);
    }
    let content = std::str::from_utf8(blob.content())
        .map_err(|_| "File is not valid UTF-8".to_string())?;
    Ok(content.lines().map(|l| l.to_string()).collect())
}

fn resolve_tree<'a>(repo: &'a Repository, refname: &str) -> Result<git2::Tree<'a>, String> {
    repo.revparse_single(refname)
        .and_then(|obj| obj.peel_to_tree())
        .map_err(|e| format!("Failed to resolve '{}': {}", refname, e))
}

fn create_tree_diff<'a>(
    repo: &'a Repository,
    from_ref: &str,
    to_ref: &str,
) -> Result<Diff<'a>, String> {
    let from_tree = resolve_tree(repo, from_ref)?;
    let to_tree = resolve_tree(repo, to_ref)?;

    repo.diff_tree_to_tree(Some(&from_tree), Some(&to_tree), None)
        .map_err(|e| format!("Failed to create diff: {}", e))
}

fn extract_file_summaries(diff: &Diff) -> Result<Vec<FileSummary>, String> {
    let stats_list: Vec<_> = (0..diff.deltas().count())
        .map(|i| {
            let delta = diff.deltas().nth(i).unwrap();
            let path = delta
                .new_file()
                .path()
                .unwrap_or_else(|| delta.old_file().path().unwrap_or(std::path::Path::new("")))
                .to_string_lossy()
                .to_string();
            let old_path = if delta.status() == Delta::Renamed {
                delta
                    .old_file()
                    .path()
                    .map(|p| p.to_string_lossy().to_string())
            } else {
                None
            };

            FileSummary {
                path,
                old_path,
                status: delta_to_status(delta.status()),
                additions: 0,
                deletions: 0,
            }
        })
        .collect();

    // Get line stats via diff.stats()
    let mut summaries = stats_list;

    // Use print to count per-file additions/deletions
    let mut file_idx: i32 = -1;
    let additions = std::cell::RefCell::new(Vec::<usize>::new());
    let deletions = std::cell::RefCell::new(Vec::<usize>::new());

    for _ in 0..summaries.len() {
        additions.borrow_mut().push(0);
        deletions.borrow_mut().push(0);
    }

    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        match line.origin() {
            '+' => {
                if let Some(a) = additions.borrow_mut().get_mut(file_idx as usize) {
                    *a += 1;
                }
            }
            '-' => {
                if let Some(d) = deletions.borrow_mut().get_mut(file_idx as usize) {
                    *d += 1;
                }
            }
            'F' => {
                file_idx += 1;
            }
            _ => {}
        }
        true
    })
    .map_err(|e| format!("Failed to print diff: {}", e))?;

    let adds = additions.into_inner();
    let dels = deletions.into_inner();
    for (i, summary) in summaries.iter_mut().enumerate() {
        summary.additions = adds.get(i).copied().unwrap_or(0);
        summary.deletions = dels.get(i).copied().unwrap_or(0);
    }

    Ok(summaries)
}

fn extract_file_diff(diff: &Diff, file_path: &str) -> Result<FileDiff, String> {
    let mut hunks: Vec<Hunk> = Vec::new();
    let mut current_lines: Vec<DiffLine> = Vec::new();
    let mut current_header = String::new();
    let mut current_old_start = 0u32;
    let mut current_old_lines = 0u32;
    let mut current_new_start = 0u32;
    let mut current_new_lines = 0u32;
    let mut file_status = FileStatus::Modified;
    let mut file_old_path: Option<String> = None;
    let mut total_adds = 0usize;
    let mut total_dels = 0usize;

    diff.print(git2::DiffFormat::Patch, |delta, hunk, line| {
        // Capture file info from delta
        file_status = delta_to_status(delta.status());
        if delta.status() == Delta::Renamed {
            file_old_path = delta
                .old_file()
                .path()
                .map(|p| p.to_string_lossy().to_string());
        }

        if let Some(hunk) = hunk {
            let header = String::from_utf8_lossy(hunk.header()).to_string();
            if header != current_header && !current_header.is_empty() {
                hunks.push(Hunk {
                    header: current_header.clone(),
                    old_start: current_old_start,
                    old_lines: current_old_lines,
                    new_start: current_new_start,
                    new_lines: current_new_lines,
                    lines: std::mem::take(&mut current_lines),
                });
            }
            current_header = header;
            current_old_start = hunk.old_start();
            current_old_lines = hunk.old_lines();
            current_new_start = hunk.new_start();
            current_new_lines = hunk.new_lines();
        }

        let origin = match line.origin() {
            '+' => {
                total_adds += 1;
                DiffLineOrigin::Addition
            }
            '-' => {
                total_dels += 1;
                DiffLineOrigin::Deletion
            }
            _ => DiffLineOrigin::Context,
        };

        // Skip file headers
        if line.origin() == 'F' || line.origin() == 'H' || line.origin() == 'B' {
            return true;
        }

        let content = String::from_utf8_lossy(line.content()).to_string();

        current_lines.push(DiffLine {
            origin,
            old_lineno: line.old_lineno(),
            new_lineno: line.new_lineno(),
            content,
        });

        true
    })
    .map_err(|e| format!("Failed to extract diff: {}", e))?;

    // Push last hunk
    if !current_header.is_empty() {
        hunks.push(Hunk {
            header: current_header,
            old_start: current_old_start,
            old_lines: current_old_lines,
            new_start: current_new_start,
            new_lines: current_new_lines,
            lines: current_lines,
        });
    }

    Ok(FileDiff {
        path: file_path.to_string(),
        old_path: file_old_path,
        status: file_status,
        additions: total_adds,
        deletions: total_dels,
        hunks,
    })
}
