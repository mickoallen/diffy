# DiFFY

<p align="center">
  <img src="images/logowithback.png" alt="DiFFY" width="400" />
</p>

<p align="center">
  <img src="images/screenshot1.png" alt="DiFFY screenshot" width="900" />
</p>

A desktop app for reviewing git diffs with AI-powered explanations. Compare branches, inspect commits, and get plain-language summaries of code changes — all without leaving your desktop.

## Features

- **Git diff viewer** — browse file-by-file diffs with syntax highlighting
- **Branch comparison** — compare any two branches or commits in a local repo
- **Claude AI integration** — get instant plain-language explanations of changes
- **Syntax highlighting** — diffs rendered with language-aware coloring

## Prerequisites

### Node.js 18+

**macOS/Linux** — via [nvm](https://github.com/nvm-sh/nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
```

**Windows** — download the installer from [nodejs.org](https://nodejs.org/).

Verify: `node --version`

### Rust (stable)

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows** — download and run [rustup-init.exe](https://rustup.rs/).

Restart your shell, then verify: `rustc --version`

Tauri also requires a C compiler and platform libraries. See the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/) for OS-specific steps (e.g. `xcode-select --install` on macOS, `build-essential` on Ubuntu).

### Claude API key

1. Sign in at [console.anthropic.com](https://console.anthropic.com/) and create an API key.
2. Open DiFFY, click the **Settings** icon, and paste the key. It is stored locally and never transmitted anywhere except Anthropic's API.

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
