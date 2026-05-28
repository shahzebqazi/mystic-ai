# AGENTS.md — mystic-ai showcase monorepo

Public [mystic-ai](https://github.com/shahzebqazi/mystic-ai): **UX/UI mockups**, **design-system tooling**, and **archived AI harness experiments**. Runnable agent products live in **[cursor-agents](https://github.com/shahzebqazi/cursor-agents)**.

## Scope

| In scope | Out of scope |
|----------|----------------|
| Brand asset pipeline, design guide, desktop mockups | Production agent deploys (MPD, Mastodon, Pi sync) |
| Static HTML/CSS prototypes under `branches/` | Private `my-cursor-config`, hostnames, tokens |
| dotAi orchestration tree (reference / heritage) | LinkedIn paste automation (see `my-linkedin`) |

## Layout (current paths)

| Category | Path | Proof for reviewers |
|----------|------|---------------------|
| **Showcase — brand** | [`Assets/`](Assets/) | Kotlin generators → SVG/CSS/HTML design guide |
| **Showcase — UI** | [`Mockups/`](Mockups/) | React desktop shell, brand tokens, GitHub Pages |
| **Showcase — design docs** | [`Documentation/DesignGuide/`](Documentation/DesignGuide/) | 99designs-style checklist, asset manifest |
| **Experiments (archive)** | [`branches/`](branches/) | Search/RAG UI, MLX stub, orchestration notes |
| **Orchestration (heritage)** | [`Orchestration/`](Orchestration/) | Markdown-first agent harness; superseded by cursor-agents for shipping |

Index: [`docs/HUB_INDEX.md`](docs/HUB_INDEX.md) · Future layout: [`docs/MONOREPO_V2_ROADMAP.md`](docs/MONOREPO_V2_ROADMAP.md) · Moved paths: [`docs/RETIRED_PATHS.md`](docs/RETIRED_PATHS.md)

## Before you edit

1. Read this file and the package `README.md` for the area you touch.
2. Never commit `.env`, keys, or personal clone paths.
3. Prefer small PRs to `main` ([`CONTRIBUTING.md`](CONTRIBUTING.md)).
4. For **git workspace / multi-repo sync**, use [`cursor-agents/tooling/git-workspace-agent/`](https://github.com/shahzebqazi/cursor-agents/tree/main/tooling/git-workspace-agent).

## Related repos

| Repo | Role |
|------|------|
| [cursor-agents](https://github.com/shahzebqazi/cursor-agents) | Public agent toolkit (skills, products, platform) |
| [cursor-config](https://github.com/shahzebqazi/cursor-config) | Public workspace docs mirror |
| my-linkedin (private) | Profile copy, Featured links, lane A positioning |
| [sqazi.sh](https://sqazi.sh) | Portfolio + CV |

Reviewers: [`docs/employer/README.md`](docs/employer/README.md)
