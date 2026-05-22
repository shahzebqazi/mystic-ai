<script lang="ts">
  import { onMount } from "svelte";
  import { nativeInvoke } from "$lib/bridge";

  let searxBaseUrl = $state("http://127.0.0.1:18080");
  let llamaHost = $state("127.0.0.1");
  let llamaPort = $state(8081);
  let llmContextTokens = $state(32768);
  let msg = $state("");

  onMount(async () => {
    try {
      const raw = await nativeInvoke<string>("loadSettings", {});
      const o = JSON.parse(raw) as Record<string, unknown>;
      if (typeof o.searxBaseUrl === "string") searxBaseUrl = o.searxBaseUrl;
      if (typeof o.llamaHost === "string") llamaHost = o.llamaHost;
      if (typeof o.llamaPort === "number") llamaPort = o.llamaPort;
      if (typeof o.llmContextTokens === "number") llmContextTokens = o.llmContextTokens;
    } catch {
      msg = "Could not load settings.";
    }
  });

  async function save() {
    const json = JSON.stringify({
      searxBaseUrl,
      llamaHost,
      llamaPort,
      llmContextTokens,
    });
    try {
      await nativeInvoke("saveSettings", { json });
      msg = "Saved.";
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<svelte:head>
  <title>Settings — Minerva</title>
</svelte:head>

<div class="wrap">
  <a class="back" href="..">← Search</a>
  <h1>Settings</h1>
  <p class="sub">Persisted in Application Support (native) or mock (browser).</p>

  <label>
    SearXNG base URL
    <input bind:value={searxBaseUrl} />
  </label>
  <label>
    LLM host
    <input bind:value={llamaHost} />
  </label>
  <label>
    LLM port
    <input type="number" bind:value={llamaPort} />
  </label>
  <label>
    Context tokens (meter)
    <input type="number" bind:value={llmContextTokens} />
  </label>

  <button type="button" onclick={() => void save()}>Save</button>
  {#if msg}
    <p class="msg">{msg}</p>
  {/if}
</div>

<style>
  .wrap {
    max-width: 520px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  .back {
    font-size: 0.85rem;
  }
  h1 {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .sub {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
  label {
    display: block;
    margin: 0.75rem 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  input {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    padding: 0.45rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-subtle);
    background: rgba(0, 0, 0, 0.25);
    color: var(--text-primary);
  }
  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--text-primary);
    font-family: var(--font);
  }
  .msg {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
</style>
