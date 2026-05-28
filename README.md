<div align="center">

<p align="center">
  <img src="docs/assets/hero.svg" alt="mystic-ai" width="100%" />
</p>

# mystic-ai

### Brand-system codegen, desktop UX mockups, and design-guide artifacts

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-cba6f7.svg)](https://shahzebqazi.github.io/mystic-ai/)

**Portfolio proof for UX/UI and design ops** — tokens, logos, interactive mockups, and exported design guides. Shippable Cursor agent packages live in **[cursor-agents](https://github.com/shahzebqazi/cursor-agents)**.

> **Scope:** Design + research showcase. Archived RAG/MLX spikes live under [`branches/`](branches/) — not production agent runtime.

[Live demo](#live-demo) · [Start here](#start-here-by-proof-type) · [Local run](#local-quick-start) · [Layout](#layout)

</div>

---

## Live demo

**→ [shahzebqazi.github.io/mystic-ai/](https://shahzebqazi.github.io/mystic-ai/)**

Desktop shell experiments: widgets, glass/search layouts, brand-driven styling. Open in browser before cloning the monorepo.

---

## How it fits the stack

```
┌──────────────────┐     shippable agents      ┌──────────────────┐
│    mystic-ai     │  ─── design / UX proof ─► │  cursor-agents   │
│  brand + mockups │                           │  Mastodon, MPD…  │
└──────────────────┘                           └──────────────────┘
```

---

## Start here (by proof type)

| I want to show… | Where |
|-----------------|--------|
| Brand tokens, logos, icons, CSS/HTML guide | [`Assets/`](Assets/) · [`Documentation/DesignGuide/`](Documentation/DesignGuide/) |
| Desktop UX shell (widgets, layout, glass/search) | [`Mockups/`](Mockups/) — [GitHub Pages demo](https://shahzebqazi.github.io/mystic-ai/) |
| Archived search/RAG / MLX / orchestration spikes | [`branches/`](branches/) |
| Markdown-first agent harness (heritage) | [`Orchestration/`](Orchestration/) · [`START_HERE.md`](START_HERE.md) |

Index: [`docs/HUB_INDEX.md`](docs/HUB_INDEX.md) · Charter: [`AGENTS.md`](AGENTS.md)

---

## Layout

| Category | Path |
|----------|------|
| Brand pipeline | [`Assets/`](Assets/) |
| UI mockups | [`Mockups/`](Mockups/) |
| Design guide | [`Documentation/DesignGuide/`](Documentation/DesignGuide/) |
| Experiments (archive) | [`branches/`](branches/) |
| Orchestration (heritage) | [`Orchestration/`](Orchestration/) |

---

## Local quick start

**Mockups (Vite + React):**

```bash
cd Mockups && npm install && npx vite
```

**Brand assets (Kotlin/JVM):** see [`Assets/README.md`](Assets/README.md) or tests under `Assets/src/test/kotlin/`.

---

## For reviewers

Case cards: [`docs/employer/README.md`](docs/employer/README.md)

---

## Related repos

| Repo | Role |
|------|------|
| [cursor-agents](https://github.com/shahzebqazi/cursor-agents) | Public agent monorepo |
| [sqazi.sh/mystic-ai](https://sqazi.sh/mystic-ai/) | Portfolio entry |

---

## License

MIT — see [LICENSE](LICENSE).
