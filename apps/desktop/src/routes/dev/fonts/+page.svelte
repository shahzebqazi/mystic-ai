<script lang="ts">
  import { onMount } from "svelte";
  import ChatsHistory from "$lib/icons/ChatsHistory.svelte";
  import CopyClipboard from "$lib/icons/CopyClipboard.svelte";
  import ImagePlus from "$lib/icons/ImagePlus.svelte";
  import MessagePlus from "$lib/icons/MessagePlus.svelte";
  import Microphone from "$lib/icons/Microphone.svelte";
  import OmnibarSubmitSearch from "$lib/icons/OmnibarSubmitSearch.svelte";
  import PaperclipAttach from "$lib/icons/PaperclipAttach.svelte";
  import RefreshCw from "$lib/icons/RefreshCw.svelte";
  import SettingsGear from "$lib/icons/SettingsGear.svelte";
  import SparklesAi from "$lib/icons/SparklesAi.svelte";
  import XClose from "$lib/icons/XClose.svelte";

  let probe: HTMLSpanElement | undefined = $state();
  let proseProbe: HTMLSpanElement | undefined = $state();
  let computedFamily = $state("(waiting for fonts…)");
  let computedProseFamily = $state("(waiting for fonts…)");

  const nerdGlyphSamples = [
    { label: "powerline branch", cp: "U+E0A0", char: "\u{e0a0}" },
    { label: "powerline line number", cp: "U+E0A1", char: "\u{e0a1}" },
    { label: "powerline readonly", cp: "U+E0A2", char: "\u{e0a2}" },
    { label: "powerline right angle", cp: "U+E0B0", char: "\u{e0b0}" },
    { label: "powerline forward", cp: "U+E0B1", char: "\u{e0b1}" },
    { label: "powerline backward", cp: "U+E0B2", char: "\u{e0b2}" },
    { label: "powerline lower-right", cp: "U+E0B3", char: "\u{e0b3}" },
  ];

  const bundledFontFiles = [
    "JetBrainsMonoNerdFont-Regular.ttf",
    "JetBrainsMonoNerdFont-Italic.ttf",
    "JetBrainsMonoNerdFont-Medium.ttf",
    "JetBrainsMonoNerdFont-MediumItalic.ttf",
    "JetBrainsMonoNerdFont-SemiBold.ttf",
    "JetBrainsMonoNerdFont-SemiBoldItalic.ttf",
    "JetBrainsMonoNerdFont-Bold.ttf",
    "JetBrainsMonoNerdFont-BoldItalic.ttf",
  ];

  const iconSizes = [16, 20, 22] as const;

  onMount(() => {
    void document.fonts.ready.then(() => {
      if (probe) computedFamily = getComputedStyle(probe).fontFamily;
      if (proseProbe) computedProseFamily = getComputedStyle(proseProbe).fontFamily;
    });
  });
</script>

<svelte:head>
  <title>Dev — fonts & icons · Minerva</title>
</svelte:head>

<div class="inspect">
  <header class="inspect-head">
    <a class="inspect-back" href="/">← Home</a>
    <h1 class="inspect-title">Fonts &amp; icons</h1>
    <p class="inspect-lede">
      UI uses <code>var(--font)</code> (mono, same as <code>--font-code</code>). Answer body uses
      <strong>Inter Variable</strong> via <code>var(--font-prose)</code>; <code>code</code>/
      <code>pre</code> stay mono. Dev-only unless <code>PUBLIC_SHOW_FONT_INSPECTOR=true</code>.
    </p>
  </header>

  <section class="inspect-section" aria-labelledby="fonts-heading">
    <h2 id="fonts-heading">Type</h2>
    <p class="inspect-meta">
      <span bind:this={probe} class="inspect-probe" aria-hidden="true">&nbsp;</span>
      <strong>UI / chrome computed:</strong>
      <code class="inspect-code">{computedFamily}</code>
    </p>

    <div class="inspect-type-grid">
      <div>
        <h3 class="inspect-h3">Weights (roman)</h3>
        <p class="w400">400 — The quick brown fox jumps over the lazy dog.</p>
        <p class="w500">500 — The quick brown fox jumps over the lazy dog.</p>
        <p class="w600">600 — The quick brown fox jumps over the lazy dog.</p>
        <p class="w700">700 — The quick brown fox jumps over the lazy dog.</p>
      </div>
      <div>
        <h3 class="inspect-h3">Weights (italic)</h3>
        <p class="w400 i">400 — The quick brown fox jumps over the lazy dog.</p>
        <p class="w500 i">500 — The quick brown fox jumps over the lazy dog.</p>
        <p class="w600 i">600 — The quick brown fox jumps over the lazy dog.</p>
        <p class="w700 i">700 — The quick brown fox jumps over the lazy dog.</p>
      </div>
    </div>

    <p class="inspect-mono">Il1<span class="pipe">|</span>0O — monospace sanity</p>
    <p class="inspect-symbols">
      $ <span class="prompt">$</span>curl -s local_llm/pun … &amp; — ‘quotes’ — “double” — …ellipsis
    </p>
  </section>

  <section class="inspect-section" aria-labelledby="answer-type-heading">
    <h2 id="answer-type-heading">Answer typography</h2>
    <p class="inspect-note">
      Mirrors <code>.answer-prose</code> in the results panel: sans paragraphs, monospace in
      <code>code</code> and <code>pre</code> (for when answers include HTML).
    </p>
    <p class="inspect-meta">
      <span bind:this={proseProbe} class="inspect-prose-probe" aria-hidden="true">&nbsp;</span>
      <strong>Prose computed:</strong>
      <code class="inspect-code">{computedProseFamily}</code>
    </p>
    <div class="inspect-answer-mock answer-prose">
      <p>
        Model answers render in a humanist system sans for readability. Inline tokens like
        <code>fetch("/api")</code> stay monospace.
      </p>
      <pre><code>curl -s https://example.com | jq '.items[] | .id'</code></pre>
      <p>Another paragraph checks rhythm and line length.</p>
    </div>
  </section>

  <section class="inspect-section" aria-labelledby="bundled-heading">
    <h2 id="bundled-heading">Bundled font files</h2>
    <p class="inspect-note">
      <strong>Inter Variable</strong> — <code>@fontsource-variable/inter</code> (WOFF2, bundled by Vite).
    </p>
    <p class="inspect-note">Mono — static TTF from <code>/fonts/</code> (JetBrains Mono Nerd Font, v3.3.0).</p>
    <ul class="inspect-file-list">
      {#each bundledFontFiles as f}
        <li><code>{f}</code></li>
      {/each}
    </ul>
  </section>

  <section class="inspect-section" aria-labelledby="pua-heading">
    <h2 id="pua-heading">Nerd PUA samples</h2>
    <p class="inspect-note">
      Not used in app chrome (UI uses SVG). Powerline glyphs for patch sanity checks.
    </p>
    <table class="inspect-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Codepoint</th>
          <th>Glyph</th>
        </tr>
      </thead>
      <tbody>
        {#each nerdGlyphSamples as row}
          <tr>
            <td>{row.label}</td>
            <td><code>{row.cp}</code></td>
            <td class="inspect-glyph-cell"><span class="inspect-glyph">{row.char}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="inspect-section" aria-labelledby="icons-heading">
    <h2 id="icons-heading">SVG icons</h2>
    <p class="inspect-note"><code>currentColor</code> on dark and light swatches.</p>

    <div class="inspect-icon-block">
      <h3 class="inspect-h3">Settings (gear sliders)</h3>
      <div class="inspect-swatches">
        <div class="swatch swatch-dark">
          {#each iconSizes as px}
            <div class="inspect-icon-row">
              <span class="inspect-px">{px}px</span>
              <SettingsGear size={px} />
            </div>
          {/each}
        </div>
        <div class="swatch swatch-light">
          {#each iconSizes as px}
            <div class="inspect-icon-row">
              <span class="inspect-px">{px}px</span>
              <SettingsGear size={px} />
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="inspect-icon-block">
      <h3 class="inspect-h3">Compose toolbar &amp; chat chrome</h3>
      <div class="inspect-icon-grid">
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Attach</span>
          <PaperclipAttach size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Image +</span>
          <ImagePlus size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Mic</span>
          <Microphone size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Copy</span>
          <CopyClipboard size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Refresh</span>
          <RefreshCw size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">New chat</span>
          <MessagePlus size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Close</span>
          <XClose size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Sparkles</span>
          <SparklesAi size={20} />
        </div>
        <div class="inspect-icon-chip">
          <span class="inspect-icon-chip-label">Chats</span>
          <ChatsHistory size={20} />
        </div>
      </div>
    </div>

    <div class="inspect-icon-block">
      <h3 class="inspect-h3">Omnibar submit (list + search)</h3>
      <div class="inspect-swatches">
        <div class="swatch swatch-dark">
          {#each iconSizes as px}
            <div class="inspect-icon-row">
              <span class="inspect-px">{px}px</span>
              <OmnibarSubmitSearch size={px} />
            </div>
          {/each}
        </div>
        <div class="swatch swatch-light">
          {#each iconSizes as px}
            <div class="inspect-icon-row">
              <span class="inspect-px">{px}px</span>
              <OmnibarSubmitSearch size={px} />
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="inspect-icon-block">
      <h3 class="inspect-h3">Error callout (text)</h3>
      <div class="inspect-swatches">
        <div class="swatch swatch-dark">
          <div class="inspect-icon-row">
            <span class="inspect-px">callout</span>
            <span class="callout-icon" aria-hidden="true">!</span>
          </div>
        </div>
        <div class="swatch swatch-light">
          <div class="inspect-icon-row">
            <span class="inspect-px">callout</span>
            <span class="callout-icon callout-icon--light" aria-hidden="true">!</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .inspect {
    max-width: 52rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    font-family: var(--font);
    color: var(--text);
  }

  .inspect-head {
    margin-bottom: 2rem;
  }

  .inspect-back {
    display: inline-block;
    margin-bottom: 0.75rem;
    color: var(--accent);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .inspect-back:hover {
    text-decoration: underline;
  }

  .inspect-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .inspect-lede {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .inspect-lede code {
    font-size: 0.85em;
    color: var(--text);
    background: var(--glass-fill);
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }

  .inspect-section {
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--glass-border);
  }

  .inspect-section:last-child {
    border-bottom: none;
  }

  .inspect-section h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 1rem;
  }

  .inspect-h3 {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 0.65rem;
  }

  .inspect-meta {
    margin: 0 0 1.25rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .inspect-probe {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    font-family: var(--font);
  }

  .inspect-prose-probe {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    font-family: var(--font-prose);
  }

  .inspect-answer-mock {
    padding: clamp(18px, 3vw, 24px);
    border-radius: var(--radius-lg);
    border: 1px solid var(--glass-border);
    background: var(--glass-fill);
    backdrop-filter: blur(20px) saturate(1.15);
    -webkit-backdrop-filter: blur(20px) saturate(1.15);
    max-width: var(--content-max);
    white-space: normal;
    box-shadow: var(--shadow-float);
  }

  .inspect-answer-mock p {
    margin: 0 0 0.85rem;
  }

  .inspect-answer-mock p:last-child {
    margin-bottom: 0;
  }

  .inspect-code {
    display: inline;
    font-size: 0.85em;
    word-break: break-all;
    background: var(--glass-fill);
    padding: 0.15em 0.4em;
    border-radius: 4px;
  }

  .inspect-type-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .inspect-type-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .inspect-type-grid p {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .w400 {
    font-weight: 400;
  }
  .w500 {
    font-weight: 500;
  }
  .w600 {
    font-weight: 600;
  }
  .w700 {
    font-weight: 700;
  }
  .i {
    font-style: italic;
  }

  .inspect-mono,
  .inspect-symbols {
    margin: 1rem 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .pipe {
    color: var(--accent);
  }

  .prompt {
    color: var(--success);
    font-weight: 600;
  }

  .inspect-note {
    margin: 0 0 0.75rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .inspect-file-list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .inspect-file-list li {
    margin-bottom: 0.35rem;
  }

  .inspect-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .inspect-table th,
  .inspect-table td {
    text-align: left;
    padding: 0.5rem 0.65rem;
    border-bottom: 1px solid var(--glass-border);
  }

  .inspect-table th {
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .inspect-glyph-cell {
    font-size: 1.25rem;
    line-height: 1;
  }

  .inspect-glyph {
    font-family: var(--font);
  }

  .inspect-icon-block {
    margin-bottom: 2rem;
  }

  .inspect-icon-block:last-child {
    margin-bottom: 0;
  }

  .inspect-icon-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
    padding: 12px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--glass-border);
    background: var(--bg-elevated);
  }

  .inspect-icon-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 8rem;
    color: var(--text-muted);
  }

  .inspect-icon-chip-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-faint);
    width: 4.5rem;
    flex-shrink: 0;
  }

  .inspect-swatches {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 520px) {
    .inspect-swatches {
      grid-template-columns: 1fr 1fr;
    }
  }

  .swatch {
    border-radius: var(--radius-md);
    padding: 1rem 1.1rem;
    border: 1px solid var(--glass-border);
  }

  .swatch-dark {
    background: var(--bg-elevated);
    color: var(--text);
  }

  .swatch-light {
    background: #e8eaef;
    color: #1a1c20;
    border-color: rgba(0, 0, 0, 0.12);
  }

  .inspect-icon-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 0.65rem;
  }

  .inspect-icon-row:last-child {
    margin-bottom: 0;
  }

  .inspect-px {
    flex: 0 0 3.25rem;
    font-size: 0.75rem;
    color: var(--text-faint);
  }

  .swatch-light .inspect-px {
    color: rgba(0, 0, 0, 0.45);
  }

  .callout-icon--light {
    color: #b3261e;
    border-color: rgba(179, 38, 30, 0.45);
    background: rgba(179, 38, 30, 0.12);
  }
</style>
