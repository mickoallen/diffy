# DiFFY — Claude Code Context

## What it does
DiFFY is a Tauri 2 desktop app that lets users open a local git repo, pick two branches or commits to compare, browse the resulting diffs file-by-file, and ask Claude for plain-language explanations of any change.

## Tech stack
- **Frontend:** SvelteKit 5 + TypeScript, served by Vite on port 1420
- **Desktop shell:** Tauri 2 (Rust)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) via `reqwest` in Rust

## Key source paths
| Path | Purpose |
|------|---------|
| `src/` | SvelteKit frontend (routes, components, stores) |
| `src-tauri/src/` | Rust backend |
| `src-tauri/src/ai/client.rs` | Claude API integration |
| `src-tauri/src/git/` | Git operations (diff, log, branches) |
| `src-tauri/tauri.conf.json` | Tauri app config |

## Dev workflow
```bash
npm install          # first time only
npm run tauri dev    # starts frontend + Rust backend, opens desktop window
npm run check        # TypeScript/Svelte type check
npm run tauri build  # production build
```

## Important notes
- **Port 1420** must be free — Tauri's dev server binds there.
- **Claude API key** is entered by the user in the app's Settings UI; it is stored in Tauri's secure store and never hard-coded.
- The Rust workspace is at `src-tauri/`; run `cargo` commands from there.
