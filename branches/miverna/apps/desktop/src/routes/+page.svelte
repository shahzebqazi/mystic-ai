<script lang="ts">
  import { onMount } from "svelte";
  import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
  import { invokeSafe, isTauriRuntime } from "$lib/tauri-invoke";
  import { normalizeSearxBaseUrl } from "$lib/public-searx";
  import type { AppSettings, SearxBuiltinStatus, SearxHit } from "$lib/types";
  import { normalizeSearxResults, formatDomain } from "$lib/searx";
  import {
    estimateContextFromSnapshot,
    estimateMessagesTokens,
  } from "$lib/context-meter";
  import {
    SYSTEM_PROMPT,
    buildSearchContextForLlm,
    buildUserMessage,
  } from "$lib/rag";
  import {
    HERO_AI_OFFLINE,
    fetchSearchingPun,
    llmClientBaseUrl,
    probeLlmReachable,
    streamChatCompletion,
  } from "$lib/llm";
  import type { ChatSnapshot, WorkMode } from "$lib/chats";
  import {
    loadChats,
    saveChats,
    newChatId,
    titleFromQuery,
    llmApiModelId,
  } from "$lib/chats";
  import type { ResultViewTab, TabHitBundle } from "$lib/search-tabs";
  import {
    SEARCH_TAB_DEFS,
    buildVisibleTabs,
    emptyTabBundle,
  } from "$lib/search-tabs";
  import ContextMeterRing from "$lib/ContextMeterRing.svelte";
  import ModelModeBar from "$lib/ModelModeBar.svelte";
  import SettingsGear from "$lib/icons/SettingsGear.svelte";
  import ChatsHistory from "$lib/icons/ChatsHistory.svelte";
  import MessagePlus from "$lib/icons/MessagePlus.svelte";
  import XClose from "$lib/icons/XClose.svelte";

  let query = $state("");
  let loading = $state(false);
  let errorMsg = $state<string | null>(null);
  let hits = $state<SearxHit[]>([]);
  let tabHits = $state<TabHitBundle>({});
  let activeResultTab = $state<ResultViewTab>("answer");
  let answer = $state("");
  let searched = $state(false);
  let settingsOpen = $state(false);
  let chatsOpen = $state(false);
  let chats = $state<ChatSnapshot[]>([]);
  let activeChatId = $state("");
  let selectedModel = $state("nemotron");
  let workMode = $state<WorkMode>("searching");
  /** Mirrors Rust defaults until `load_settings` returns merged paths. */
  let settings = $state<AppSettings>({
    llmBackend: "mlx",
    searxBuiltin: true,
    searxDockerPort: 18080,
    searxBaseUrl: "http://127.0.0.1:18080",
    llamaBinaryPath: "~/.minerva/venvs/mlx-openai-server/bin/mlx-openai-server",
    llamaModelPath: "mlx-community/Qwen2.5-1.5B-Instruct-4bit",
    llamaHost: "127.0.0.1",
    llamaPort: 8081,
    llmContextTokens: 32768,
  });

  let contextUsedTokens = $state(0);
  let contextUsageSource = $state<"idle" | "estimate" | "server">("idle");
  let contextStreaming = $state(false);

  let searxOk = $state(false);
  /** Built-in Docker sidecar status (from Rust); null until first probe. */
  let searxSidecarStatus = $state<SearxBuiltinStatus | null>(null);
  let llamaOk = $state(false);
  /** Snippet count passed into the overview LLM (general + merged verticals). */
  let overviewSourceCount = $state(0);
  let abortCtrl: AbortController | null = null;

  const llamaBase = $derived(
    llmClientBaseUrl(settings.llamaHost, settings.llamaPort),
  );

  let lastSearxOk = $state(false);

  let heroTagline = $state("");
  let heroTaglineLoading = $state(true);

  const showResultsChrome = $derived(searched || loading);

  const searxWebChipOk = $derived(
    settings.searxBuiltin
      ? (searxSidecarStatus?.reachable ?? false)
      : searched && !loading
        ? lastSearxOk
        : true,
  );

  const searxWebChipWarn = $derived(
    settings.searxBuiltin
      ? !loading && searxSidecarStatus != null && !searxSidecarStatus.reachable
      : searched && !loading && !lastSearxOk,
  );

  const visibleResultTabs = $derived(buildVisibleTabs(query, tabHits));

  const hasAnyTabHits = $derived(
    SEARCH_TAB_DEFS.some((d) => (tabHits[d.key]?.length ?? 0) > 0),
  );

  $effect(() => {
    const vis = visibleResultTabs;
    if (vis.length === 0) return;
    if (!vis.some((t) => t.id === activeResultTab)) {
      activeResultTab = vis[0]!.id;
    }
  });

  const activeLinkHits = $derived(
    activeResultTab === "answer"
      ? []
      : activeResultTab === "web"
        ? hits
        : (tabHits[activeResultTab] ?? []),
  );

  const chatsActiveList = $derived(
    [...chats]
      .filter((c) => !c.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
  const chatsArchivedList = $derived(
    [...chats]
      .filter((c) => c.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );

  function formatChatTime(ts: number): string {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function snapshotFromUI(): ChatSnapshot {
    const prev = chats.find((c) => c.id === activeChatId);
    const now = Date.now();
    return {
      id: activeChatId,
      title: query.trim() ? titleFromQuery(query) : (prev?.title ?? "New chat"),
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
      archived: prev?.archived ?? false,
      query,
      answer,
      hits: hits.map((h) => ({ ...h })),
      tabHits: { ...tabHits },
      activeResultTab,
      errorMsg,
      searched,
      mode: workMode,
      model: selectedModel,
    };
  }

  function persistActiveSnapshot() {
    if (!activeChatId) return;
    const snap = snapshotFromUI();
    const idx = chats.findIndex((c) => c.id === snap.id);
    const next = [...chats];
    if (idx >= 0) next[idx] = snap;
    else next.push(snap);
    chats = next;
    saveChats(chats);
  }

  function clearWorkspace() {
    loading = false;
    errorMsg = null;
    hits = [];
    tabHits = emptyTabBundle();
    activeResultTab = "answer";
    answer = "";
    overviewSourceCount = 0;
    contextUsedTokens = 0;
    contextUsageSource = "idle";
    query = "";
    searched = false;
    lastSearxOk = false;
    searxOk = false;
    abortCtrl?.abort();
    abortCtrl = null;
  }

  function applyChat(c: ChatSnapshot) {
    activeChatId = c.id;
    query = c.query;
    answer = c.answer;
    hits = c.hits.map((h) => ({ ...h }));
    tabHits =
      c.tabHits && Object.keys(c.tabHits).length > 0
        ? { ...c.tabHits }
        : { web: c.hits.map((h) => ({ ...h })) };
    activeResultTab = c.activeResultTab ?? "answer";
    errorMsg = c.errorMsg;
    searched = c.searched;
    workMode = c.mode;
    selectedModel = c.model;
    const bundleForOverview =
      c.tabHits && Object.keys(c.tabHits).length > 0
        ? c.tabHits
        : { web: c.hits };
    overviewSourceCount = c.searched
      ? buildSearchContextForLlm(bundleForOverview).hits.length
      : 0;
    contextUsedTokens = c.searched ? estimateContextFromSnapshot(c) : 0;
    contextUsageSource = c.searched ? "estimate" : "idle";
    chatsOpen = false;
  }

  function selectChat(id: string) {
    persistActiveSnapshot();
    let c = chats.find((x) => x.id === id);
    if (!c) return;
    if (c.archived) {
      chats = chats.map((x) =>
        x.id === id ? { ...x, archived: false, updatedAt: Date.now() } : x,
      );
      saveChats(chats);
      c = chats.find((x) => x.id === id);
      if (!c) return;
    }
    applyChat(c);
  }

  function openNewChat() {
    persistActiveSnapshot();
    activeChatId = newChatId();
    clearWorkspace();
    chatsOpen = false;
    void loadHeroTagline();
  }

  function deleteChat(id: string, event?: Event) {
    event?.stopPropagation();
    const wasActive = activeChatId === id;
    const next = chats.filter((c) => c.id !== id);
    chats = next;
    saveChats(chats);
    if (!wasActive) return;
    const candidates = next.filter((c) => !c.archived).sort((a, b) => b.updatedAt - a.updatedAt);
    const fallback = candidates[0];
    if (fallback) applyChat(fallback);
    else {
      activeChatId = newChatId();
      clearWorkspace();
      void loadHeroTagline();
    }
  }

  function archiveChat(id: string, event?: Event) {
    event?.stopPropagation();
    const next = chats.map((c) =>
      c.id === id ? { ...c, archived: true, updatedAt: Date.now() } : c,
    );
    chats = next;
    saveChats(chats);
    if (activeChatId !== id) return;
    const candidates = next.filter((c) => !c.archived).sort((a, b) => b.updatedAt - a.updatedAt);
    const fallback = candidates[0];
    if (fallback) applyChat(fallback);
    else {
      activeChatId = newChatId();
      clearWorkspace();
      void loadHeroTagline();
    }
  }

  function unarchiveChat(id: string, event?: Event) {
    event?.stopPropagation();
    const next = chats.map((c) =>
      c.id === id ? { ...c, archived: false, updatedAt: Date.now() } : c,
    );
    chats = next;
    saveChats(chats);
  }

  async function loadHeroTagline() {
    heroTaglineLoading = true;
    await refreshStatus();
    if (!llamaOk) {
      heroTagline = HERO_AI_OFFLINE;
      heroTaglineLoading = false;
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 14_000);
    try {
      const pun = await fetchSearchingPun(llamaBase, ac.signal);
      heroTagline = pun ?? HERO_AI_OFFLINE;
    } catch {
      heroTagline = HERO_AI_OFFLINE;
    } finally {
      window.clearTimeout(timer);
      heroTaglineLoading = false;
    }
  }

  async function refreshStatus() {
    const llamaRes = await invokeSafe<boolean>("llama_running");
    const procUp = llamaRes.ok && llamaRes.data === true;
    let httpUp = false;
    try {
      const ac = new AbortController();
      const t = window.setTimeout(() => ac.abort(), 3200);
      httpUp = await probeLlmReachable(llamaBase, ac.signal);
      window.clearTimeout(t);
    } catch {
      httpUp = false;
    }
    llamaOk = procUp || httpUp;
    searxOk = lastSearxOk;
    if (isTauriRuntime()) {
      const sx = await invokeSafe<SearxBuiltinStatus>("searx_builtin_status");
      if (sx.ok) searxSidecarStatus = sx.data;
    }
  }

  onMount(() => {
    chats = loadChats();
    activeChatId = newChatId();
    void (async () => {
      const loaded = await invokeSafe<AppSettings>("load_settings");
      if (loaded.ok) {
        settings = loaded.data;
        if (typeof settings.searxBuiltin !== "boolean") settings.searxBuiltin = true;
        if (
          typeof settings.searxDockerPort !== "number" ||
          !Number.isFinite(settings.searxDockerPort)
        ) {
          settings.searxDockerPort = 18080;
        }
        if (
          typeof settings.llmContextTokens !== "number" ||
          !Number.isFinite(settings.llmContextTokens)
        ) {
          settings.llmContextTokens = 32768;
        }
      }
      await refreshStatus();
      await loadHeroTagline();
    })();
    const t = setInterval(() => void refreshStatus(), 4000);
    return () => clearInterval(t);
  });

  function goHome() {
    persistActiveSnapshot();
    clearWorkspace();
    void loadHeroTagline();
  }

  async function saveSettings() {
    if (!settings.searxBuiltin) {
      settings.searxBaseUrl = normalizeSearxBaseUrl(settings.searxBaseUrl);
    }
    const p = Math.round(Number(settings.searxDockerPort));
    settings.searxDockerPort = Number.isFinite(p)
      ? Math.min(65535, Math.max(1, p))
      : 18080;
    const cap = Math.round(Number(settings.llmContextTokens));
    settings.llmContextTokens = Number.isFinite(cap)
      ? Math.min(262144, Math.max(2048, cap))
      : 32768;
    const res = await invokeSafe("save_settings", { settings });
    if (!res.ok) {
      errorMsg = res.message;
      return;
    }
    settingsOpen = false;
    if (!searched) void loadHeroTagline();
    void refreshStatus();
  }

  async function restartBuiltinSearx() {
    errorMsg = null;
    const res = await invokeSafe("searx_builtin_restart");
    if (!res.ok) {
      errorMsg = res.message;
      return;
    }
    await refreshStatus();
  }

  async function saveSearxDockerLogs() {
    errorMsg = null;
    const res = await invokeSafe<string>("searx_dump_container_logs");
    if (!res.ok) {
      errorMsg = res.message;
      return;
    }
    if (!isTauriRuntime()) return;
    try {
      await revealItemInDir(res.data);
      flashComposeHint("Saved logs and opened folder");
    } catch {
      flashComposeHint(`Logs saved to ${res.data}`);
    }
  }

  async function startLlama() {
    errorMsg = null;
    const res = await invokeSafe("llama_start", {
      llmBackend: settings.llmBackend,
      binaryPath: settings.llamaBinaryPath,
      modelPath: settings.llamaModelPath,
      host: settings.llamaHost,
      port: settings.llamaPort,
    });
    if (!res.ok) {
      errorMsg = res.message;
      return;
    }
    await refreshStatus();
    if (!searched) void loadHeroTagline();
  }

  async function stopLlama() {
    const res = await invokeSafe("llama_stop");
    if (!res.ok) {
      errorMsg = res.message;
      return;
    }
    await refreshStatus();
    if (!searched) void loadHeroTagline();
  }

  async function runSearch(ev: Event) {
    ev.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    loading = true;
    errorMsg = null;
    overviewSourceCount = 0;
    hits = [];
    tabHits = emptyTabBundle();
    activeResultTab = "answer";
    answer = "";
    lastSearxOk = false;
    searched = true;
    abortCtrl?.abort();
    const ac = new AbortController();
    abortCtrl = ac;

    try {
      // Stagger vertical tab requests slightly so the local engine sees spaced category traffic.
      const rows = await Promise.all(
        SEARCH_TAB_DEFS.map((d, i) =>
          (async () => {
            if (i > 0) {
              await new Promise((r) => setTimeout(r, 420 * i));
            }
            const rawRes = await invokeSafe<string>("searx_search", {
              query: q,
              categories: d.searxCategories,
            });
            if (!rawRes.ok) {
              return {
                key: d.key,
                ok: false as const,
                message: rawRes.message,
                hits: [] as SearxHit[],
              };
            }
            return {
              key: d.key,
              ok: true as const,
              hits: normalizeSearxResults(rawRes.data, d.topK),
            };
          })(),
        ),
      );

      const bundle = emptyTabBundle();
      let webFailed: string | null = null;
      for (const row of rows) {
        if (!row.ok) {
          bundle[row.key] = [];
          if (row.key === "web") webFailed = row.message;
        } else {
          bundle[row.key] = row.hits;
        }
      }
      tabHits = bundle;
      hits = bundle.web ?? [];

      if (webFailed) {
        errorMsg = webFailed;
        lastSearxOk = false;
        searxOk = false;
        return;
      }

      lastSearxOk = true;
      searxOk = true;

      const llmSearchCtx = buildSearchContextForLlm(bundle);
      overviewSourceCount = llmSearchCtx.hits.length;

      const anyVertical = rows.some((r) => r.ok && r.hits.length > 0);
      if (!anyVertical && hits.length === 0) {
        return;
      }

      if (hits.length === 0) {
        if (anyVertical) {
          answer =
            "No general web results for this query. Check Images, Videos, or other tabs—or rephrase for a text summary.";
        }
        return;
      }

      if (llamaOk) {
        const messages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          {
            role: "user" as const,
            content: buildUserMessage(q, workMode, llmSearchCtx.block),
          },
        ];
        const promptTok = estimateMessagesTokens(messages);
        contextStreaming = true;
        contextUsageSource = "estimate";
        contextUsedTokens = promptTok;
        let completionChars = 0;
        const { usage: streamUsage } = await streamChatCompletion(
          llamaBase,
          messages,
          (c) => {
            answer += c;
            completionChars += c.length;
            contextUsedTokens =
              promptTok + Math.ceil(completionChars / 4);
          },
          ac.signal,
          { model: llmApiModelId(selectedModel) },
        );
        contextStreaming = false;
        if (streamUsage?.totalTokens != null) {
          contextUsedTokens = streamUsage.totalTokens;
          contextUsageSource = "server";
        } else if (
          streamUsage?.promptTokens != null &&
          streamUsage.completionTokens != null
        ) {
          contextUsedTokens =
            streamUsage.promptTokens + streamUsage.completionTokens;
          contextUsageSource = "server";
        } else {
          contextUsedTokens =
            promptTok + Math.ceil(completionChars / 4);
          contextUsageSource = "estimate";
        }
      } else {
        answer =
          "The local model server is not running. Open Settings, pick llama.cpp or MLX, set the binary and model, then Start LLM—or start the server yourself. Search tabs still show SearXNG results from the built-in or custom instance below.";
      }
    } catch (e) {
      const msg = String(e);
      errorMsg = msg;
      lastSearxOk = false;
      searxOk = false;
    } finally {
      loading = false;
      contextStreaming = false;
      persistActiveSnapshot();
    }
  }

  async function openLink(url: string) {
    if (isTauriRuntime()) {
      try {
        await openUrl(url);
      } catch {
        flashComposeHint("Could not open link");
      }
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  let composeHint = $state<string | null>(null);
  let composeHintTimer: ReturnType<typeof setTimeout> | undefined;

  function flashComposeHint(message: string) {
    composeHint = message;
    if (composeHintTimer !== undefined) clearTimeout(composeHintTimer);
    composeHintTimer = setTimeout(() => {
      composeHint = null;
      composeHintTimer = undefined;
    }, 3200);
  }

  async function copyAnswer() {
    if (!answer.trim()) return;
    try {
      await navigator.clipboard.writeText(answer);
      flashComposeHint("Overview copied to clipboard");
    } catch {
      flashComposeHint("Could not copy to clipboard");
    }
  }

  async function rerunSearch() {
    await runSearch(new Event("submit"));
  }

  function toggleChats() {
    const next = !chatsOpen;
    if (next) settingsOpen = false;
    chatsOpen = next;
  }

  function openSettings() {
    chatsOpen = false;
    settingsOpen = true;
  }

  $effect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (settingsOpen) {
        e.preventDefault();
        settingsOpen = false;
        return;
      }
      if (!chatsOpen) return;
      e.preventDefault();
      chatsOpen = false;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

{#snippet omnibarRow()}
  <input
    class="omnibar-input"
    type="search"
    placeholder="e.g. SearXNG JSON API parameters"
    bind:value={query}
    aria-label="Search query"
    autocomplete="off"
    spellcheck="false"
  />
  <button class="omnibar-submit" type="submit" disabled={loading}>Search</button>
{/snippet}

<div
  class="chats-root"
  class:chats-root--open={chatsOpen}
  class:chats-root--settings-open={settingsOpen}
>
  <aside
    class="chats-sidebar"
    aria-labelledby="chats-sidebar-title"
    aria-hidden={!chatsOpen}
    inert={!chatsOpen}
  >
    <div class="chats-sidebar-header">
      <h2 id="chats-sidebar-title" class="chats-sidebar-title">Chats</h2>
      <button
        type="button"
        class="chats-sidebar-close"
        onclick={() => (chatsOpen = false)}
        aria-label="Close chat list"
      >
        <XClose size={18} />
      </button>
    </div>
    <div class="chats-sidebar-body">
      <div class="chats-toolbar">
        <button type="button" class="btn-primary chats-new-btn" onclick={openNewChat}>
          <MessagePlus size={18} />
          New chat
        </button>
      </div>

      {#if chatsActiveList.length === 0}
        <p class="chat-empty">No active chats yet. Run a search to create one, or start new.</p>
      {:else}
        <p class="chat-list-label" id="active-chats-label">Active</p>
        <ul class="chat-list" aria-labelledby="active-chats-label">
          {#each chatsActiveList as c (c.id)}
            <li>
              <div
                class="chat-row"
                class:chat-row--active={c.id === activeChatId}
                role="button"
                tabindex="0"
                onclick={() => selectChat(c.id)}
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectChat(c.id);
                  }
                }}
              >
                <div class="chat-row-main">
                  <span class="chat-row-title">{c.title}</span>
                  <span class="chat-row-meta">{formatChatTime(c.updatedAt)} · {c.mode}</span>
                </div>
                <div class="chat-row-actions">
                  <button
                    type="button"
                    class="chat-row-action"
                    onclick={(e) => archiveChat(c.id, e)}>Archive</button>
                  <button
                    type="button"
                    class="chat-row-action chat-row-action--danger"
                    onclick={(e) => deleteChat(c.id, e)}>Delete</button>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

      {#if chatsArchivedList.length > 0}
        <h3 class="chat-archived-heading">Archived</h3>
        <ul class="chat-list" aria-label="Archived chats">
          {#each chatsArchivedList as c (c.id)}
            <li>
              <div
                class="chat-row chat-row--archived"
                role="button"
                tabindex="0"
                onclick={() => selectChat(c.id)}
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectChat(c.id);
                  }
                }}
              >
                <div class="chat-row-main">
                  <span class="chat-row-title">{c.title}</span>
                  <span class="chat-row-meta">{formatChatTime(c.updatedAt)}</span>
                </div>
                <div class="chat-row-actions">
                  <button
                    type="button"
                    class="chat-row-action"
                    onclick={(e) => {
                      e.stopPropagation();
                      unarchiveChat(c.id, e);
                    }}>Restore</button>
                  <button
                    type="button"
                    class="chat-row-action chat-row-action--danger"
                    onclick={(e) => deleteChat(c.id, e)}>Delete</button>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </aside>

  {#if chatsOpen}
    <button
      type="button"
      class="chats-scrim"
      onclick={() => (chatsOpen = false)}
      aria-label="Dismiss chat list"
    ></button>
  {/if}

  <div class="chats-stage">
    <div class="shell">
  {#if !showResultsChrome}
    <button
      type="button"
      class="fab-chats"
      onclick={toggleChats}
      aria-label={chatsOpen ? "Close chats" : "Open chats"}
      aria-expanded={chatsOpen}
    >
      <ChatsHistory size={22} />
    </button>
    <button
      type="button"
      class="fab-settings"
      onclick={openSettings}
      aria-label="Settings"
      aria-expanded={settingsOpen}
    >
      <SettingsGear size={22} />
    </button>

    <main class="hero">
      <h1 class="hero-logo">Minerva</h1>
      {#if heroTaglineLoading}
        <p class="hero-tagline hero-tagline--loading">
          <span class="prompt">$</span>curl -s local_llm/pun …
        </p>
      {:else}
        <p class="hero-tagline">{heroTagline}</p>
      {/if}
      <p class="hero-sub">
        A SearXNG instance managed by Minerva (Docker on your machine by default) fills the Search and vertical tabs; the Overview tab pairs your question with those hits on-device when the local LLM is running.
      </p>
      <div class="hero-search-stack">
        <form class="omnibar-form" onsubmit={runSearch}>
          <div class="omnibar">
            {@render omnibarRow()}
          </div>
          {#if composeHint}
            <p class="compose-hint" role="status" aria-live="polite">{composeHint}</p>
          {/if}
        </form>
        <p class="hero-hint">
          <kbd>Enter</kbd> to submit · Overview cites SearXNG sources by number · Search tab is raw results
        </p>
        <div class="hero-model-context-row">
          <ModelModeBar bind:selectedModel bind:workMode />
          <ContextMeterRing
            used={contextUsedTokens}
            limit={settings.llmContextTokens}
            streaming={contextStreaming}
            source={contextUsageSource}
          />
        </div>
      </div>
    </main>
  {:else}
    <header class="results-header">
      <div class="results-header-inner">
        <button
          type="button"
          class="header-icon-btn header-chat-btn"
          onclick={toggleChats}
          aria-label={chatsOpen ? "Close chats" : "Open chats"}
          aria-expanded={chatsOpen}
        >
          <ChatsHistory size={20} />
        </button>
        <button type="button" class="brand-btn" onclick={goHome} title="New search">Minerva</button>
        <div class="header-search-wrap">
          <form class="omnibar-form" onsubmit={runSearch}>
            <div class="omnibar">
              {@render omnibarRow()}
            </div>
            {#if composeHint}
              <p class="compose-hint" role="status" aria-live="polite">{composeHint}</p>
            {/if}
          </form>
          <ModelModeBar bind:selectedModel bind:workMode compact />
        </div>
        <div class="status-group">
          <ContextMeterRing
            used={contextUsedTokens}
            limit={settings.llmContextTokens}
            streaming={contextStreaming}
            source={contextUsageSource}
          />
          <span
            class="status-chip"
            class:ok={searxWebChipOk}
            class:warn={searxWebChipWarn}
            title="SearXNG"
          >
            <span class="dot" aria-hidden="true"></span>
            Web
          </span>
          <span
            class="status-chip"
            class:ok={llamaOk}
            title={settings.llmBackend === "mlx" ? "mlx-openai-server" : "llama-server"}
          >
            <span class="dot" aria-hidden="true"></span>
            Model
          </span>
          <button
            type="button"
            class="header-icon-btn"
            onclick={openSettings}
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <SettingsGear size={20} />
          </button>
        </div>
      </div>
    </header>

    <main class="results-main">
      {#if errorMsg}
        <div class="callout-error" role="alert">
          <span class="callout-icon" aria-hidden="true">!</span>
          <div>
            <strong>Could not complete search</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      {/if}

      {#if loading}
        <div class="result-view">
          <div class="result-tabs" aria-hidden="true">
            {#each [1, 2, 3, 4] as _}
              <span class="result-tab result-tab--skeleton skel-block shimmer skel-line" style="width: 72px; height: 32px; margin: 0"></span>
            {/each}
          </div>
          <div class="result-panel-skel">
            <div class="skel-block shimmer skel-line" style="width: 120px; height: 10px; margin-bottom: 20px"></div>
            <div class="skel-block shimmer skel-line"></div>
            <div class="skel-block shimmer skel-line"></div>
            <div class="skel-block shimmer skel-line short"></div>
          </div>
        </div>
      {:else if searched && !errorMsg && !hasAnyTabHits && hits.length === 0}
        <section class="empty-state" aria-labelledby="empty-results-title">
          <h2 id="empty-results-title" class="empty-state-title">No web results</h2>
          <p class="empty-state-body">
            Try a shorter query or different keywords. If the built-in search engine is offline, open Settings: confirm Docker is running, try Restart search engine, or switch to a custom SearXNG URL under Advanced.
          </p>
        </section>
      {:else if searched && !errorMsg && (hasAnyTabHits || hits.length > 0)}
        <div class="result-view">
          <div
            class="result-tabs"
            role="tablist"
            aria-label="Search result views"
          >
            {#each visibleResultTabs as t (t.id)}
              <button
                type="button"
                class="result-tab"
                role="tab"
                aria-selected={activeResultTab === t.id}
                aria-controls="result-tab-panel"
                id="result-tab-{t.id}"
                onclick={() => {
                  activeResultTab = t.id;
                  persistActiveSnapshot();
                }}
              >
                {t.label}
                {#if t.id !== "answer" && t.count > 0}
                  <span class="result-tab-count">{t.count}</span>
                {/if}
              </button>
            {/each}
          </div>

          <div
            id="result-tab-panel"
            role="tabpanel"
            aria-labelledby="result-tab-{activeResultTab}"
            class="result-tab-panel"
          >
            {#if activeResultTab === "answer"}
              <article class="answer-panel answer-panel--tabbed" aria-live="polite">
                <div class="answer-panel-header">
                  <h2 class="answer-panel-title">Overview</h2>
                  <div class="answer-panel-trailing">
                    {#if answer.trim()}
                      <div class="answer-panel-tools">
                        <button type="button" class="text-action-btn" onclick={() => void copyAnswer()}>
                          Copy overview
                        </button>
                        <button
                          type="button"
                          class="text-action-btn"
                          onclick={() => void rerunSearch()}
                          disabled={loading || !query.trim()}
                        >
                          Regenerate
                        </button>
                      </div>
                    {/if}
                    <span class="answer-meta">
                      {overviewSourceCount} hit(s) sent to model (all verticals, deduped) · LLM picks
                      relevant [n]
                    </span>
                  </div>
                </div>
                <div class="answer-prose">{answer}</div>
              </article>
            {:else if activeResultTab === "images"}
              {@const imgHits = tabHits.images ?? []}
              {#if imgHits.length === 0}
                <p class="tab-empty">No image results for this query.</p>
              {:else}
                <ul class="image-result-grid" aria-label="Image results">
                  {#each imgHits as h (h.url)}
                    <li>
                      <a
                        class="image-result-card"
                        href={h.url}
                        onclick={(e) => {
                          e.preventDefault();
                          void openLink(h.url);
                        }}
                      >
                        {#if h.thumbnail}
                          <img
                            class="image-result-thumb"
                            src={h.thumbnail}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        {:else}
                          <div class="image-result-thumb image-result-thumb--placeholder" aria-hidden="true"></div>
                        {/if}
                        <span class="image-result-title">{h.title}</span>
                        <span class="image-result-domain">{formatDomain(h.url)}</span>
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
            {:else}
              {#if activeLinkHits.length === 0}
                <p class="tab-empty">No results in this category for this query.</p>
              {:else}
                <div class="source-scroll source-scroll--tabbed">
                  <ol class="source-list" aria-label="Vertical search results">
                    {#each activeLinkHits as h, i (h.url)}
                      <li class="source-list-item">
                        <button
                          type="button"
                          class="source-row"
                          onclick={() => void openLink(h.url)}
                        >
                          <span class="source-num" aria-hidden="true">{i + 1}</span>
                          <span class="source-row-body">
                            <span class="source-row-title">{h.title}</span>
                            <span class="source-row-domain">{formatDomain(h.url)}</span>
                            {#if h.content}
                              <span class="source-row-snippet">{h.content}</span>
                            {/if}
                          </span>
                        </button>
                      </li>
                    {/each}
                  </ol>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      {/if}
    </main>
  {/if}
    </div>
  </div>

  <div
    class="settings-panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
    aria-hidden={!settingsOpen}
    inert={!settingsOpen}
  >
    <div class="settings-panel-header">
      <h2 id="settings-title" class="settings-panel-title">Settings</h2>
      <button
        type="button"
        class="chats-sidebar-close"
        onclick={() => (settingsOpen = false)}
        aria-label="Close settings"
      >
        <XClose size={18} />
      </button>
    </div>
    <div class="settings-panel-body">
      <div class="settings-panel-inner">
        <p class="settings-lead">
          <strong>Search:</strong> by default Minerva runs SearXNG in Docker, bound to <code class="settings-code"
            >127.0.0.1</code> only (see <code class="settings-code">docs/embedded-searxng.md</code>). Requires Docker
          Desktop (macOS/Windows) or Docker Engine (Linux). <strong>LLM:</strong> local OpenAI-compatible server —
          <strong>llama.cpp</strong> (<code class="settings-code">llama-server</code> + GGUF) or <strong>MLX</strong> on
          Apple Silicon (<code class="settings-code">mlx-openai-server</code> + Hub id or local MLX folder). The app
          autostarts the LLM when the binary resolves and the model is valid. Env overrides:
          <code class="settings-code">MINERVA_LLAMA_BINARY</code> / <code class="settings-code">MINERVA_LLAMA_MODEL</code>
          (llama.cpp), <code class="settings-code">MINERVA_MLX_SERVER_BINARY</code> / <code class="settings-code"
            >MINERVA_MLX_MODEL</code> (MLX). GGUF: <code class="settings-code">npm run download-model:nemotron</code>.
          MLX: <code class="settings-code">pip install mlx-openai-server</code> (<a
            href="https://github.com/cubist38/mlx-openai-server"
            target="_blank"
            rel="noreferrer noopener">mlx-openai-server</a
          >).
        </p>
        <div class="field">
          <label for="llm-backend">Local LLM backend</label>
          <select id="llm-backend" bind:value={settings.llmBackend} class="settings-select">
            <option value="llamacpp">llama.cpp (GGUF + llama-server)</option>
            <option value="mlx">MLX Hub / local MLX (mlx-openai-server)</option>
          </select>
          <p class="field-hint">
            MLX needs macOS on Apple Silicon. Use a repo id such as
            <code class="settings-code">mlx-community/Qwen2.5-1.5B-Instruct-4bit</code> or a downloaded MLX model path.
          </p>
        </div>
        <div class="field">
          <label for="searx-mode">Web search engine</label>
          <p class="field-hint field-hint--block">
            Built-in mode runs the official <code class="settings-code">searxng/searxng</code> image, publishes only on
            loopback, and stops the container when you quit Minerva. Edit engines in the YAML file shown in status
            (copy is created on first run from the app bundle).
          </p>
          <div class="searx-builtin-status" role="status">
            {#if searxSidecarStatus}
              <p class="searx-status-line">
                <span class="settings-code">Docker:</span>
                {searxSidecarStatus.dockerAvailable
                  ? "available"
                  : searxSidecarStatus.dockerError ?? "unavailable"}
              </p>
              {#if settings.searxBuiltin}
                <p class="searx-status-line">
                  <span class="settings-code">Endpoint:</span>
                  {searxSidecarStatus.effectiveBaseUrl}
                  ·
                  <span class="settings-code">reachable:</span>
                  {searxSidecarStatus.reachable ? "yes" : "no"}
                </p>
                {#if searxSidecarStatus.settingsPath}
                  <p class="searx-status-line searx-status-line--path">
                    <span class="settings-code">settings.yml:</span>
                    {searxSidecarStatus.settingsPath}
                  </p>
                {/if}
                <p class="field-hint">{searxSidecarStatus.logsHint}</p>
              {/if}
            {:else if isTauriRuntime()}
              <p class="field-hint">Loading search engine status…</p>
            {:else}
              <p class="field-hint">Search engine status is available in the Minerva desktop app (Tauri).</p>
            {/if}
          </div>
          <div class="field field--inline">
            <label class="checkbox-row">
              <input type="checkbox" bind:checked={settings.searxBuiltin} />
              Use built-in SearXNG (Docker)
            </label>
          </div>
          {#if settings.searxBuiltin}
            <div class="field">
              <label for="searx-port">Host port (127.0.0.1 only)</label>
              <input
                id="searx-port"
                type="number"
                bind:value={settings.searxDockerPort}
                min="1"
                max="65535"
                autocomplete="off"
              />
              <p class="field-hint">
                Default 18080 avoids common OpenResty/nginx stacks on 8080. The LLM server uses a separate port (8081 by default).
              </p>
            </div>
            <div class="btn-row searx-actions">
              <button type="button" class="btn-secondary" onclick={() => void restartBuiltinSearx()}>
                Restart search engine
              </button>
              <button type="button" class="btn-secondary" onclick={() => void saveSearxDockerLogs()}>
                Save container logs…
              </button>
            </div>
          {:else}
            <div class="field">
              <label for="searx">Custom SearXNG base URL</label>
              <input
                id="searx"
                bind:value={settings.searxBaseUrl}
                autocomplete="off"
                placeholder="https://… or http://127.0.0.1:18080"
              />
              <p class="field-hint">
                Advanced: point Minerva at any JSON-capable SearXNG instance you operate or trust. You manage privacy,
                rate limits, and availability.
              </p>
            </div>
          {/if}
        </div>
        <div class="field">
          <label for="llama-bin"
            >{settings.llmBackend === "mlx" ? "mlx-openai-server" : "llama-server"} binary</label
          >
          <input
            id="llama-bin"
            bind:value={settings.llamaBinaryPath}
            placeholder={settings.llmBackend === "mlx"
              ? "mlx-openai-server or full path"
              : "/path/to/llama-server"}
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="llama-model"
            >{settings.llmBackend === "mlx" ? "MLX model (Hub id or path)" : "GGUF model file"}</label
          >
          <input
            id="llama-model"
            bind:value={settings.llamaModelPath}
            placeholder={settings.llmBackend === "mlx"
              ? "mlx-community/Your-Model-4bit"
              : "/path/to/model.gguf"}
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="llama-host">LLM host</label>
          <input id="llama-host" bind:value={settings.llamaHost} autocomplete="off" />
        </div>
        <div class="field">
          <label for="llama-port">LLM port</label>
          <input id="llama-port" type="number" bind:value={settings.llamaPort} min="1" max="65535" />
        </div>
        <div class="field">
          <label for="llm-ctx">Model context window (tokens)</label>
          <input
            id="llm-ctx"
            type="number"
            bind:value={settings.llmContextTokens}
            min="2048"
            max="262144"
            step="1024"
            autocomplete="off"
          />
          <p class="field-hint">
            Used for the circular context meter (set to your loaded model’s real limit). Usage is
            <strong>estimated</strong> while streaming unless the server returns token counts.
          </p>
        </div>
        <p class="field-hint field-hint--block">
          If this device cannot run local models, you can still search with the engine above. For a reference Docker
          Compose stack (optional, outside the app), see <code class="settings-code">infra/searxng/</code>.
        </p>
      </div>
    </div>
    <div class="settings-panel-footer">
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick={startLlama}>Start LLM</button>
        <button type="button" class="btn-secondary" onclick={stopLlama}>Stop LLM</button>
      </div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick={() => (settingsOpen = false)}>Close</button>
        <button type="button" class="btn-primary" onclick={saveSettings}>Save</button>
      </div>
    </div>
  </div>
</div>
