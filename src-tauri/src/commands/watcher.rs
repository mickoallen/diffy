use crate::watcher::{self, WatcherState};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn start_watching(
    path: String,
    app: AppHandle,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    let new_debouncer = watcher::start(app, &path)?;
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
