use crate::watcher::{self, WatcherState};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn start_watching(
    path: String,
    app: AppHandle,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    // Run the blocking watcher setup (FSEvents init can be slow) off the async runtime.
    let new_debouncer = tokio::task::spawn_blocking(move || watcher::start(app, &path))
        .await
        .map_err(|e| e.to_string())??;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(new_debouncer);
    Ok(())
}

#[tauri::command]
pub async fn stop_watching(state: State<'_, WatcherState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}
