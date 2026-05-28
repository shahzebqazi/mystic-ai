# Case: Desktop UX mockups

## Problem

Explore a desktop-style agent shell (widgets, panels, home lock, bottom panel resize) with real brand tokens before committing to a production stack.

## Approach

[`Mockups/`](../../Mockups/) — Vite + React:

- Brand CSS variables from the asset pipeline.
- Widget grid, navigation chrome, static HTML companions (`static/landing.html`, `static/executive.html`).
- GitHub Actions workflow deploys to Pages.

## Outcome

Reviewable **interaction and visual design** at [shahzebqazi.github.io/mystic-ai/](https://shahzebqazi.github.io/mystic-ai/) without claiming a shipped desktop product.

Local run:

```bash
cd Mockups && npm install && npx vite
```
