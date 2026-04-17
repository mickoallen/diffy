import { invoke } from '@tauri-apps/api/core';

export interface BranchInfo {
	name: string;
	is_head: boolean;
	is_remote: boolean;
	is_default: boolean;
	upstream: string | null;
}

export interface CommitInfo {
	id: string;
	summary: string;
	author: string;
	time: number;
}

export interface FileSummary {
	path: string;
	old_path: string | null;
	status: 'Added' | 'Deleted' | 'Modified' | 'Renamed';
	additions: number;
	deletions: number;
	is_binary: boolean;
}

export interface DiffSummary {
	files: FileSummary[];
	total_additions: number;
	total_deletions: number;
}

export interface DiffLine {
	origin: 'Addition' | 'Deletion' | 'Context';
	old_lineno: number | null;
	new_lineno: number | null;
	content: string;
}

export interface Hunk {
	header: string;
	old_start: number;
	old_lines: number;
	new_start: number;
	new_lines: number;
	lines: DiffLine[];
}

export interface FileDiff {
	path: string;
	old_path: string | null;
	status: 'Added' | 'Deleted' | 'Modified' | 'Renamed';
	additions: number;
	deletions: number;
	is_binary: boolean;
	hunks: Hunk[];
}

export async function openRepo(path: string): Promise<string> {
	return invoke('open_repo', { path });
}

export async function listBranches(path: string): Promise<BranchInfo[]> {
	return invoke('list_branches', { path });
}

export async function getCommitsBetween(
	path: string,
	fromRef: string,
	toRef: string
): Promise<CommitInfo[]> {
	return invoke('get_commits_between', { path, fromRef, toRef });
}

export async function getDiffSummary(
	path: string,
	fromRef: string,
	toRef: string,
	ignoreWhitespace = false
): Promise<DiffSummary> {
	return invoke('get_diff_summary', { path, fromRef, toRef, ignoreWhitespace });
}

export async function getFileDiff(
	path: string,
	fromRef: string,
	toRef: string,
	filePath: string,
	ignoreWhitespace = false
): Promise<FileDiff> {
	return invoke('get_file_diff', { path, fromRef, toRef, filePath, ignoreWhitespace });
}

export async function getWorkdirSummary(
	path: string,
	ignoreWhitespace = false
): Promise<DiffSummary> {
	return invoke('get_workdir_summary', { path, ignoreWhitespace });
}

export async function getWorkdirFileDiff(
	path: string,
	filePath: string,
	ignoreWhitespace = false
): Promise<FileDiff> {
	return invoke('get_workdir_file_diff', { path, filePath, ignoreWhitespace });
}

export async function getStagedSummary(
	path: string,
	ignoreWhitespace = false
): Promise<DiffSummary> {
	return invoke('get_staged_summary', { path, ignoreWhitespace });
}

export async function getStagedFileDiff(
	path: string,
	filePath: string,
	ignoreWhitespace = false
): Promise<FileDiff> {
	return invoke('get_staged_file_diff', { path, filePath, ignoreWhitespace });
}

export async function getUnstagedSummary(
	path: string,
	ignoreWhitespace = false
): Promise<DiffSummary> {
	return invoke('get_unstaged_summary', { path, ignoreWhitespace });
}

export async function getUnstagedFileDiff(
	path: string,
	filePath: string,
	ignoreWhitespace = false
): Promise<FileDiff> {
	return invoke('get_unstaged_file_diff', { path, filePath, ignoreWhitespace });
}

export async function getLocalVsRemote(
	path: string
): Promise<[DiffSummary, string, string]> {
	return invoke('get_local_vs_remote', { path });
}

export async function getRemoteUrl(path: string): Promise<string> {
	return invoke('get_remote_url', { path });
}

export async function getDefaultBranch(path: string): Promise<string> {
	return invoke('get_default_branch', { path });
}

export async function getBranchToWorkdirSummary(
	path: string,
	baseRef: string,
	ignoreWhitespace = false
): Promise<DiffSummary> {
	return invoke('get_branch_to_workdir_summary', { path, baseRef, ignoreWhitespace });
}

export async function getBranchToWorkdirFileDiff(
	path: string,
	baseRef: string,
	filePath: string,
	ignoreWhitespace = false
): Promise<FileDiff> {
	return invoke('get_branch_to_workdir_file_diff', { path, baseRef, filePath, ignoreWhitespace });
}

export async function listRepoFiles(path: string): Promise<string[]> {
	return invoke('list_repo_files', { path });
}

export async function readRepoFile(path: string, filePath: string): Promise<string> {
	return invoke('read_repo_file', { path, filePath });
}

export async function getFileContent(
	path: string,
	refName: string,
	filePath: string
): Promise<string[]> {
	return invoke('get_file_content', { path, refName, filePath });
}

export interface FileBytes {
	base64: string;
	mime: string;
}

/** Fetch raw bytes of a file. Pass an empty `refName` to read the working copy. */
export async function getFileBytes(
	path: string,
	refName: string,
	filePath: string
): Promise<FileBytes> {
	return invoke('get_file_bytes', { path, refName, filePath });
}
