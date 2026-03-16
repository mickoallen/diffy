use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebounceEventResult};
use serde::Serialize;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
pub struct RefreshPayload {
    pub kind: String,
}

type Debouncer = notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>;

pub struct WatcherState(pub Mutex<Option<Debouncer>>);

impl WatcherState {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

pub fn start(app_handle: AppHandle, repo_path: &str) -> Result<Debouncer, String> {
    let app = app_handle.clone();

    let mut debouncer = new_debouncer(
        Duration::from_secs(2),
        move |result: DebounceEventResult| {
            let events = match result {
                Ok(events) => events,
                Err(_) => return,
            };

            let mut has_git_state = false;
            let mut has_workdir = false;

            for event in &events {
                let path_str = event.path.to_string_lossy();
                let in_git_dir = path_str.contains("/.git/") || path_str.contains("\\.git\\");

                if in_git_dir {
                    if path_str.ends_with("HEAD")
                        || path_str.contains("/refs/")
                        || path_str.contains("\\refs\\")
                        || path_str.ends_with("index")
                    {
                        has_git_state = true;
                    }
                } else {
                    has_workdir = true;
                }
            }

            if has_git_state {
                let _ = app.emit(
                    "git://refresh",
                    RefreshPayload {
                        kind: "git-state".to_string(),
                    },
                );
            }
            if has_workdir {
                let _ = app.emit(
                    "git://refresh",
                    RefreshPayload {
                        kind: "workdir".to_string(),
                    },
                );
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(std::path::Path::new(repo_path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    Ok(debouncer)
}
