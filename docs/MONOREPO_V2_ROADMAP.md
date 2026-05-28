# Monorepo v2 roadmap (mystic-ai)

Align directory naming and docs with **[cursor-agents](https://github.com/shahzebqazi/cursor-agents)** v2: clear categories, employer case cards, `AGENTS.md` per area — **without** mixing shippable agent products into this repo.

## Goals

1. **Showcase-first README** — recruiters see design + UX proof above the fold.
2. **Explicit split** — mystic-ai = design/mockups/guide; cursor-agents = agents/skills/products.
3. **Small PRs** — path moves one category at a time; update [`RETIRED_PATHS.md`](RETIRED_PATHS.md) each merge.

## Epics (suggested)

| Epic | Work | Status |
|------|------|--------|
| E1 — Docs & charter | `AGENTS.md`, `docs/HUB_INDEX.md`, `docs/employer/`, README | Done (2026-05-27) |
| E2 — `showcase/` scaffold | Move `Assets`, `Mockups`, `DesignGuide` with compat symlinks or CI path updates | Planned |
| E3 — `experiments/` | Rename `branches/` → `experiments/`; stub README per branch | Planned |
| E4 — `heritage/orchestration` | Optional move of `Orchestration/`; trim `START_HERE.md` to pointer | Planned |
| E5 — Pages & sqazi.sh | Single demo URL; mockups workflow `base` path audit | Planned |
| E6 — LinkedIn Featured | mystic-ai as design case; cursor-agents as agent case | Coordinated in `my-linkedin` |

## Out of scope here

- Copying cursor-agents **products** into mystic-ai.
- Private infra, tokens, or `~/Git` layout (git-agent / my-cursor-config).

## Contributing

One epic ≈ one PR where practical. Link issues when the GitHub project board is wired for this repo.
