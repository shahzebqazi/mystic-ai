<script lang="ts">
  import { onMount } from "svelte";
  import { nativeInvoke, hasNativeBridge } from "$lib/bridge";
  import { normalizeSearxResults, formatDomain } from "$lib/searx";
  import { buildChatBody, parseLlmContent } from "$lib/rag";
  import { loadChats, saveChats, newId } from "$lib/chats";
  import type { SearxHit, ChatSnap } from "$lib/types";

  let query = $state("");
  let loading = $state(false);
  let err = $state<string | null>(null);
  let hits = $state<SearxHit[]>([]);
  let answer = $state("");
  let synthBusy = $state(false);
  let hero = $state("");
  let chats = $state<ChatSnap[]>([]);
  let activeId = $state("");
  let bridgeHint = $state("");

  onMount(() => {
    chats = loadChats();
    activeId = chats[0]?.id ?? newId();
    if (!chats.length) {
      chats = [{ id: activeId, title: "New chat", updatedAt: Date.now(), query: "", answer: "", hitsJson: "[]" }];
      saveChats(chats);
    }
    bridgeHint = hasNativeBridge()
      ? "Native bridge active."
      : "Browser preview — native SearX/LLM when run in the Mac shell.";
    void loadHero();
  });

  async function loadHero() {
    try {
      const body = JSON.stringify({
        model: "local",
        messages: [
          {
            role: "user",
            content: "One short witty search-related pun, max 12 words, no quote marks.",
          },
        ],
        temperature: 0.9,
        max_tokens: 40,
        stream: false,
      });
      const raw = await nativeInvoke<string>("llmChat", { body });
      const t = parseLlmContent(raw);
      hero = t || "Local search, synthesized answers, your machine.";
    } catch {
      hero = "Offline hero: plug in your LLM server in Settings.";
    }
  }

  function persist() {
    const idx = chats.findIndex((c) => c.id === activeId);
    const snap: ChatSnap = {
      id: activeId,
      title: query.trim() || "New chat",
      updatedAt: Date.now(),
      query,
      answer,
      hitsJson: JSON.stringify(hits),
    };
    const next = [...chats];
    if (idx >= 0) next[idx] = snap;
    else next.push(snap);
    chats = next;
    saveChats(chats);
  }

  function newChat() {
    persist();
    const id = newId();
    activeId = id;
    query = "";
    hits = [];
    answer = "";
    err = null;
    chats = [...chats, { id, title: "New chat", updatedAt: Date.now(), query: "", answer: "", hitsJson: "[]" }];
    saveChats(chats);
  }

  function openChat(c: ChatSnap) {
    persist();
    activeId = c.id;
    query = c.query;
    answer = c.answer;
    try {
      hits = JSON.parse(c.hitsJson) as SearxHit[];
    } catch {
      hits = [];
    }
  }

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    loading = true;
    err = null;
    hits = [];
    answer = "";
    try {
      const json = await nativeInvoke<string>("searxSearch", {
        query: q,
        categories: "general",
      });
      hits = normalizeSearxResults(json, 14);
      if (!hits.length) err = "No results (check SearXNG JSON or query).";
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
      persist();
    }
  }

  const sortedChats = $derived.by(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt));

  async function synthesize() {
    if (!query.trim() || !hits.length) return;
    synthBusy = true;
    err = null;
    try {
      const body = buildChatBody(query, hits);
      const raw = await nativeInvoke<string>("llmChat", { body });
      answer = parseLlmContent(raw) || "(empty model response)";
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    } finally {
      synthBusy = false;
      persist();
    }
  }
</script>

<div class="shell">
  <aside class="rail">
    <div class="rail-head">Chats</div>
    <button type="button" class="icon-btn" onclick={newChat} title="New chat">+</button>
    {#each sortedChats as c (c.id)}
    <button
      type="button"
      class="chat-row"
      class:active={c.id === activeId}
      onclick={() => openChat(c)}
    >
      {c.title.slice(0, 28) || "…"}
    </button>
    {/each}
  </aside>

  <main class="main">
    <header class="top">
      <span class="brand">Minerva</span>
      <span class="hint">{bridgeHint}</span>
      <nav class="nav">
        <a href="settings">Settings</a>
        <a href="dev/fonts">Fonts</a>
      </nav>
    </header>

    <section class="hero">
      <p class="hero-line">{hero}</p>
      <form
        class="omni"
        onsubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
      >
        <input
          class="omni-input"
          placeholder="Ask anything… (e.g. best ffmpeg one-liner for wav to mp3)"
          bind:value={query}
          disabled={loading}
        />
        <button type="submit" class="search-btn" disabled={loading}>Search</button>
      </form>
    </section>

    {#if err}
      <p class="err">{err}</p>
    {/if}
    {#if loading}
      <p class="meta">Searching…</p>
    {/if}

    <div class="grid">
      <div class="panel">
        <div class="panel-h">Sources</div>
        <ul class="hits">
          {#each hits as h, i (h.url)}
            <li class="hit">
              <span class="idx">{i + 1}</span>
              <div>
                <a href={h.url} target="_blank" rel="noreferrer">{h.title}</a>
                <div class="dom">{formatDomain(h.url)}</div>
                {#if h.content}
                  <div class="snip prose">{h.content}</div>
                {/if}
              </div>
            </li>
          {:else}
            <li class="empty">No sources yet.</li>
          {/each}
        </ul>
        <button type="button" class="secondary" onclick={() => void synthesize()} disabled={synthBusy || !hits.length}>
          {synthBusy ? "Synthesizing…" : "Synthesize overview"}
        </button>
      </div>
      <div class="panel answer">
        <div class="panel-h">Overview</div>
        <div class="prose answer-body">{answer || "—"}</div>
      </div>
    </div>
  </main>
</div>

<style>
  .shell {
    display: flex;
    min-height: 100vh;
  }
  .rail {
    width: 200px;
    border-right: 1px solid var(--border-subtle);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: rgba(255, 255, 255, 0.02);
  }
  .rail-head {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .icon-btn {
    border: 1px solid var(--border-subtle);
    background: transparent;
    color: var(--text-primary);
    border-radius: 4px;
    width: 28px;
    height: 28px;
    line-height: 1;
  }
  .chat-row {
    text-align: left;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    padding: 0.35rem 0.25rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  .chat-row.active {
    border-color: var(--border-subtle);
    color: var(--text-primary);
    background: var(--glass-bg);
  }
  .main {
    flex: 1;
    padding: 1rem 1.5rem 2rem;
    max-width: 1100px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .brand {
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    flex: 1;
  }
  .nav a {
    margin-left: 0.75rem;
    font-size: 0.85rem;
  }
  .hero {
    padding: 1.25rem;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    background: var(--glass-bg);
    margin-bottom: 1rem;
  }
  .hero-line {
    margin: 0 0 0.75rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  .omni {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .omni-input {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border-radius: 4px;
    border: 1px solid var(--border-subtle);
    background: rgba(0, 0, 0, 0.25);
    color: var(--text-primary);
    font-size: 1rem;
  }
  .search-btn {
    padding: 0.55rem 1rem;
    border-radius: 4px;
    border: 1px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--text-primary);
  }
  .search-btn:disabled {
    opacity: 0.5;
  }
  .err {
    color: var(--danger);
  }
  .meta {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 800px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .shell {
      flex-direction: column;
    }
    .rail {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
  .panel {
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 0.75rem;
    background: var(--glass-bg);
  }
  .panel-h {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }
  .hits {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem;
    max-height: 420px;
    overflow: auto;
  }
  .hit {
    display: flex;
    gap: 0.5rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  .idx {
    color: var(--accent);
    font-size: 0.75rem;
    min-width: 1.25rem;
  }
  .dom {
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .snip {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.2rem;
  }
  .empty {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
  .secondary {
    border: 1px solid var(--border-subtle);
    background: transparent;
    color: var(--text-primary);
    padding: 0.45rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  .answer-body {
    min-height: 200px;
    white-space: pre-wrap;
    font-size: 0.95rem;
  }
</style>
