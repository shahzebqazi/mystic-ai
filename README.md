# mystic-ai

Public **design + AI showcase**: brand-system codegen, interactive desktop mockups, design-guide artifacts, and archived harness experiments.

**Shippable agent tooling** (Mastodon, MPD, git workspace, Pi patterns) lives in **[cursor-agents](https://github.com/shahzebqazi/cursor-agents)** — this repo is the portfolio proof for **UX/UI, mockups, and design ops**, plus early AI-orchestration research.

## Start here (by proof type)

| I want to show… | Where |
|-----------------|--------|
| Brand tokens, logos, icons, exported CSS/HTML guide | [`Assets/`](Assets/) · [`Documentation/DesignGuide/`](Documentation/DesignGuide/) |
| Desktop UX shell (widgets, layout, glass/search experiments) | [`Mockups/`](Mockups/) — [GitHub Pages demo](https://shahzebqazi.github.io/mystic-ai/) |
| Archived search/RAG / MLX / orchestration spikes | [`branches/`](branches/) |
| Markdown-first agent harness (heritage) | [`Orchestration/`](Orchestration/) · [`START_HERE.md`](START_HERE.md) |

Full index: [`docs/HUB_INDEX.md`](docs/HUB_INDEX.md) · Agent charter: [`AGENTS.md`](AGENTS.md)

## Layout

| Category | Path |
|----------|------|
| Showcase — brand pipeline | [`Assets/`](Assets/) |
| Showcase — UI mockups | [`Mockups/`](Mockups/) |
| Showcase — design guide | [`Documentation/DesignGuide/`](Documentation/DesignGuide/) |
| Experiments (archive) | [`branches/`](branches/) |
| Orchestration (heritage) | [`Orchestration/`](Orchestration/) |

Roadmap (path alignment with cursor-agents v2): [`docs/MONOREPO_V2_ROADMAP.md`](docs/MONOREPO_V2_ROADMAP.md)

## For reviewers

[`docs/employer/README.md`](docs/employer/README.md) — case cards for design-system codegen, desktop mockups, and agent-harness heritage.

## Local quick starts

**Mockups (Vite + React):**

```bash
cd Mockups && npm install && npx vite
```

**Brand assets (Kotlin/JVM):** see [`Assets/README.md`](Assets/README.md) if present, or run tests under `Assets/src/test/kotlin/`.

## Related repos

| Repo | Role |
|------|------|
| [cursor-agents](https://github.com/shahzebqazi/cursor-agents) | Public Cursor agent monorepo |
| [cursor-config](https://github.com/shahzebqazi/cursor-config) | Workspace docs (no secrets) |
| Portfolio | [sqazi.sh](https://sqazi.sh) · [sqazi.sh/mystic-ai/](https://sqazi.sh/mystic-ai/) |

## License

MIT — see [LICENSE](LICENSE).
