<svelte:head>
  <title>Fonts — Minerva</title>
</svelte:head>

<div class="wrap">
  <a class="back" href="../..">← Home</a>
  <h1>Font inspector</h1>
  <p class="mono">JetBrains Mono Nerd Font — chrome / labels</p>
  <p class="prose">Inter Variable — prose body sample. The quick brown fox jumps over the lazy dog.</p>
  <div class="grid">
    <span class="lab">400</span>
    <p class="w400">Minerva master UI pack</p>
    <span class="lab">600</span>
    <p class="w600">Minerva master UI pack</p>
  </div>
</div>

<style>
  .wrap {
    padding: 2rem;
    max-width: 640px;
    margin: 0 auto;
  }
  .back {
    font-size: 0.85rem;
  }
  h1 {
    font-size: 1.2rem;
  }
  .mono {
    font-family: var(--font);
    font-size: 1.1rem;
  }
  .prose {
    font-family: var(--font-prose);
    font-size: 1rem;
    line-height: 1.6;
  }
  .grid {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 0.5rem 1rem;
    margin-top: 1.5rem;
    align-items: baseline;
  }
  .lab {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  .w400 {
    font-family: var(--font);
    font-weight: 400;
  }
  .w600 {
    font-family: var(--font);
    font-weight: 600;
  }
</style>
