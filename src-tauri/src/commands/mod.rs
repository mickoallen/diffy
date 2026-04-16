pub mod ai;
pub mod diff;
pub mod git;
pub mod watcher;

/// Run a blocking git operation on tokio's blocking pool and unwrap the join error.
pub async fn git_blocking<T, F>(f: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|e| format!("git task join failed: {}", e))?
}
