# Glass UI design system (search product)

Visual direction: **dark, layered frosted panels** with **hairline borders**—inspired by modern “glass” desktop UIs (e.g. Cursor-style chrome). This document is **not** affiliated with any product; use it as an internal spec for `apps/desktop` and the static mockup in `mockup/`.

## Principles

- **Calm density**: Chrome stays compact; the **answer** and **sources** get comfortable line length and spacing.
- **Hierarchy**: Query → synthesized answer → ranked sources. Settings and metadata never compete with the answer.
- **Floating glass**: Primary surfaces feel **slightly detached** from the viewport edges (padding, soft shadow), not flush spreadsheet panels.
- **Restrained accent**: Monochrome UI + **one** accent for links, focus, and primary actions.

## Color tokens

| Token | Role | Example (dark) |
|-------|------|----------------|
| `--void` | Page background | `#07080b` |
| `--elev-1` | Subtle wash behind glass | `#0c0e14` |
| `--glass-bg` | Panel fill (over blur) | `rgba(255,255,255,0.06)` |
| `--glass-bg-strong` | Elevated panels | `rgba(255,255,255,0.09)` |
| `--border-subtle` | Hairline | `rgba(255,255,255,0.10)` |
| `--border-strong` | Hover / focus ring helper | `rgba(255,255,255,0.18)` |
| `--text-primary` | Body | `rgba(255,255,255,0.92)` |
| `--text-secondary` | Meta, hints | `rgba(255,255,255,0.55)` |
| `--text-tertiary` | Disabled, de-emphasized | `rgba(255,255,255,0.38)` |
| `--accent` | Interactive emphasis | `#7eb8ff` (adjust per brand) |
| `--accent-muted` | Links on glass | `color-mix(in srgb, var(--accent) 85%, white)` |
| `--danger` | Errors | `#f87171` |
| `--success` | Rare positive signals | `#4ade80` |

**Contrast**: Aim for **≥ 4.5:1** for primary text on effective background. On heavy blur, test with a **busy** wallpaper behind the window (Tauri) or gradient (mockup).

## Elevation and glass

- **Blur**: `backdrop-filter: blur(20px) saturate(1.2)` on main panels; reduce or remove when `prefers-reduced-transparency: reduce`.
- **Tint**: Always pair blur with a **semi-opaque** fill so text remains legible if blur is unsupported.
- **Radius scale**: `8px` (chips), `12px` (inputs), `16px` (cards), `20px` (hero shell).
- **Shadow**: Very soft outer shadow, e.g. `0 24px 80px rgba(0,0,0,0.45)` on the main column—avoid harsh drop shadows.
- **Max content width**: Answer column **65–75ch**; sources rail **min 280px / max 380px** beside or below depending on breakpoint.

## Typography

- **Font stack**: `ui-sans-serif, system-ui, "SF Pro Text", "Segoe UI", Inter, sans-serif`.
- **Scale** (reference):
  - Query input: `1.125rem`–`1.25rem`, semibold.
  - Answer body: `0.9375rem`–`1rem`, line-height **1.6**.
  - Source title: `0.875rem`, medium.
  - Source snippet / domain: `0.8125rem`, secondary color.
  - Meta (timings, model): `0.75rem`, tertiary, optional **tabular nums** (`font-variant-numeric: tabular-nums`).

## Components

### App shell

- **Top bar** (optional): product name, settings (gear), connection dots (SearXNG / llama). Height ~48px, glass strip.

### Query bar

- Full-width inside hero card; pill or rounded rect; placeholder: short, actionable.
- **Trailing**: submit control + shortcut hint (`↵`).
- **Focus**: `1px` ring using `--accent` at ~40% opacity + `--border-strong` border.

### Answer panel

- Contains title (“Answer”) or omit if obvious; body supports **markdown-like** paragraphs in production.
- **Streaming**: Blinking caret or subtle “pulse” dot at end of text; avoid marquee effects.
- **Citations**: Inline `[1]` markers or superscript chips linking to source index.

### Source list

- Each row: **favicon** placeholder circle, **title** (link), **domain** on second line, **snippet** (2 lines max, ellipsis).
- Hover: slightly stronger glass (`--glass-bg-strong`) and border lift.

### Settings (stub)

- Modal or side sheet: **SearXNG base URL**, **llama server URL**, **model path** (Phase 1+). Same glass language.

## States

| State | Treatment |
|-------|-----------|
| Empty | Centered hero query only; faint gradient/mesh background. |
| Loading | Skeleton blocks matching answer + 3 source rows; `prefers-reduced-motion` → static gray blocks, no shimmer. |
| Streaming | Growing answer text + disabled duplicate submit or “Stop” (future). |
| Error | Glass **callout** with `--danger` left border or icon; one clear sentence + retry. |
| No results | Neutral callout; suggest broader query. |

## Motion

- **Duration**: 120–180ms for hover/focus; 200–280ms for panel mount.
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` for interactive; avoid bouncy springs in chrome.
- **Reduced motion**: Replace shimmer with solid placeholders; shorten transitions to ~1ms or `none` per CSS.

## Accessibility

- Visible **focus** on all interactive elements; do not rely on blur alone.
- **Keyboard order**: Query → Submit → first source link → settings.
- **`prefers-reduced-transparency`**: Swap to solid `--elev-1` / `--void` panels, remove or minimize `backdrop-filter`.
- **Screen readers**: Answer region `aria-live="polite"` when streaming (app); mockup may omit if static.

## Mapping to code

- **Mockup**: [`mockup/glass.css`](../mockup/glass.css) defines `:root` tokens; [`mockup/search-glass.html`](../mockup/search-glass.html) demonstrates layout states.
- **App**: Mirror tokens in `apps/desktop/src/app.css` (or `src/styles/tokens.css`) and reuse class names where practical.
