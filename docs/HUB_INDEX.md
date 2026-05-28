# mystic-ai hub index

**mystic-ai** = public **design showcase** + **archived AI experiments**.  
**cursor-agents** = public **shippable agent packages** (skills, products, platform).

## Showcase (primary)

| Package | Path | Stack | Demo |
|---------|------|-------|------|
| Brand asset pipeline | [`../Assets/`](../Assets/) | Kotlin → SVG/PNG/CSS/HTML | Generated `Mockups/public/brand/brand.css` |
| Desktop mockups | [`../Mockups/`](../Mockups/) | React, Vite, CSS tokens | [GitHub Pages](https://shahzebqazi.github.io/mystic-ai/) |
| Design guide | [`../Documentation/DesignGuide/`](../Documentation/DesignGuide/) | Markdown + HtmlExporter output | Checklist + manifest in-repo |

## Experiments (archive)

| Branch dir | Former focus |
|------------|----------------|
| [`../branches/miverna/`](../branches/miverna/) | Search / RAG UI (Svelte, Convex, glass mockups) |
| [`../branches/seance/`](../branches/seance/) | Research spike (genomics ↔ model config) |
| [`../branches/mlx-gemma/`](../branches/mlx-gemma/) | Local MLX model stub |
| [`../branches/orchestrator-architecture/`](../branches/orchestrator-architecture/) | Multi-agent orchestration notes |

Details: [`../branches/README.md`](../branches/README.md)

## Orchestration (heritage)

| Path | Notes |
|------|--------|
| [`../Orchestration/`](../Orchestration/) | dotAi markdown-first harness |
| [`../START_HERE.md`](../START_HERE.md) | Legacy agent entry (read `AGENTS.md` first) |
| [`../memories/`](../memories/) | Settings / constraints for harness |

Active shipping patterns: **[cursor-agents](https://github.com/shahzebqazi/cursor-agents)**.

## Docs site

| Page | Path |
|------|------|
| Glossary (Pages home) | [`index.md`](index.md) |
| Pages setup | [`PAGES_SETUP.md`](PAGES_SETUP.md) |

## Sibling repo

| Need | Use |
|------|-----|
| Git sync, dirty trees, layout v2 | [cursor-agents `tooling/git-workspace-agent`](https://github.com/shahzebqazi/cursor-agents/tree/main/tooling/git-workspace-agent) |
| Music / Mastodon agents | [cursor-agents `products/`](https://github.com/shahzebqazi/cursor-agents/tree/main/products) |
| Private operator hub | **my-cursor-config** (not public) |

Roadmap: [`MONOREPO_V2_ROADMAP.md`](MONOREPO_V2_ROADMAP.md) · Retired paths: [`RETIRED_PATHS.md`](RETIRED_PATHS.md)
