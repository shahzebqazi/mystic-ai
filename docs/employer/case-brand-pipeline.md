# Case: Brand system codegen

## Problem

A consistent visual identity (logos, icons, banners, tokens) must stay in sync across mockups, static HTML, and a browsable design guide—without hand-editing dozens of SVG/CSS files.

## Approach

[`Assets/`](../../Assets/) — Kotlin generators and exporters:

- Generators: logo, icon, banner, hero, pixel variants.
- Exporters: SVG, PNG, CSS variables (`--mystic-*`), HTML design guide via `HtmlExporter`.
- Tests under `Assets/src/test/kotlin/mystic/assets/` lock output shape.

Design checklist: [`Documentation/DesignGuide/`](../../Documentation/DesignGuide/).

## Outcome

Single pipeline from brand config → artifacts consumed by [`Mockups/public/brand/brand.css`](../../Mockups/public/brand/brand.css). Demonstrates **design ops + engineering**, not only Figma handoff.
