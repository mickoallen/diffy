# DiFFY

<p align="center">
  <img src="images/logowithback.png" alt="DiFFY" width="400" />
</p>

A desktop app for reviewing git diffs with AI-powered explanations. Compare branches, inspect commits, and get plain-language summaries of code changes — all without leaving your desktop.

## Features

- **Git diff viewer** — browse file-by-file diffs with syntax highlighting
- **Branch comparison** — compare any two branches or commits in a local repo
- **Claude AI integration** — get instant plain-language explanations of changes
- **Syntax highlighting** — diffs rendered with language-aware coloring

## Prerequisites

- [Rust toolchain](https://rustup.rs/) (stable) — install with `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [Node.js](https://nodejs.org/) 18+
- A [Claude API key](https://console.anthropic.com/) (set via Settings in the app)

## Development

```bash
npm install
npm run tauri dev
```

The app opens at `localhost:1420`. Changes to the SvelteKit frontend hot-reload automatically; Rust backend changes trigger a recompile.

## Build

```bash
npm run tauri build
```

Produces a platform-native installer in `src-tauri/target/release/bundle/`.

## Tech Stack

- [Tauri 2](https://tauri.app/) — Rust-based desktop shell
- [SvelteKit 5](https://svelte.dev/) — frontend framework
- [TypeScript](https://www.typescriptlang.org/) — frontend types
- [Claude API](https://www.anthropic.com/) — AI explanations via `claude-sonnet-4-6`
