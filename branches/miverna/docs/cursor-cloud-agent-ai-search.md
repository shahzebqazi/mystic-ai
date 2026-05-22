# Cursor Cloud Agent: AI search research

This repository includes a **reusable research agent** for Cursor Cloud Agents (and any Cursor agent run with the same instructions). It is **not** a deployed service—only files in this repo.

## What it does

- Surveys **AI-assisted search**: retrieval-augmented answers, web search + LLMs, ranking, agents, evaluation, UX.
- Uses **in-repo** sources first: `convex/seedPapersList.ts`, `convex/seedData.ts`, `AGENTS.md` (product constraints only), `docs/`, and `apps/desktop/src/lib/` search-related modules.
- Produces **structured outputs**: themes, paper IDs, gaps, risks—no personal data.

## How to enable in Cursor (Cloud Agent)

1. Open **Cursor Settings → Cloud Agent** (or your team’s Cloud Agent setup).
2. Point the agent at this repository (or branch).
3. Paste the contents of **`/.cursor/agents/ai-search-research.md`** into the agent’s **instructions** / **system prompt** field, **or** rely on the rule in **`.cursor/rules/ai-search-research.mdc`** if your Cursor version applies rules to Cloud Agents.
4. Optional: set the agent’s default task to **“Run a research pass per `docs/cursor-cloud-agent-ai-search.md` using the prompt in `.cursor/agents/ai-search-research.md`.”**

## Privacy and safety (required)

- **Do not** copy or paste **secrets**, **API keys**, **tokens**, **`.env` values**, or **credentials** into GitHub issues or agent outputs.
- **Do not** expose **personal identifiers** (names, emails, internal account IDs) from any file; treat `AGENTS.md` as **project/product context**, not a biography.
- **Do not** instruct the agent to “read the user’s Convex deployment” or cloud dashboards unless the operator explicitly provides credentials in a **private** session; the repo’s Convex **schema and seed** are the public source of truth here.

## Updating the corpus

After changing `convex/seedPapersList.ts` or `convex/seedData.ts`, run locally (if you use Convex):

```bash
npm run convex:seed
```

The agent instructions reference these files as read-only research context.
