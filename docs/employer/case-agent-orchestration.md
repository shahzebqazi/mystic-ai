# Case: Agent harness heritage

## Problem

Early work needed a markdown-first way to coordinate AI agents (tasks, skills, memories, constraints) without standing up protocol servers.

## Approach

[`Orchestration/`](../../Orchestration/) — dotAi-style harness:

- `Orchestration/Tasks/`, `Orchestration/Skills/`, `Orchestration/Constraints/`.
- Entry: [`START_HERE.md`](../../START_HERE.md) (legacy; prefer [`AGENTS.md`](../../AGENTS.md)).

Archived product spikes live under [`branches/`](../../branches/) (search UI, MLX, orchestration notes).

## Outcome

Patterns informed **[cursor-agents](https://github.com/shahzebqazi/cursor-agents)** (skills, charters, monorepo v2). **Shipping** agents (music, Mastodon, git workspace) are maintained there—not duplicated here.
