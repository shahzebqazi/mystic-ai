<script lang="ts">
  import { formatTokenShort } from "./context-meter";

  interface Props {
    used: number;
    limit: number;
    streaming?: boolean;
    source?: "idle" | "estimate" | "server";
  }

  let {
    used,
    limit,
    streaming = false,
    source = "idle",
  }: Props = $props();

  const r = 15;
  const c = 2 * Math.PI * r;

  const pct = $derived(
    limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0,
  );

  const dash = $derived((pct / 100) * c);

  const band = $derived(
    pct >= 90 ? "risk" : pct >= 72 ? "warn" : "safe",
  );

  const label = $derived(
    source === "server"
      ? "ctx · API"
      : source === "estimate"
        ? streaming
          ? "ctx · est…"
          : "ctx · est"
        : "ctx",
  );

  const aria = $derived(
    `Model context about ${Math.round(pct)} percent used, ${formatTokenShort(Math.round(used))} of ${formatTokenShort(Math.round(limit))} tokens, ${source === "server" ? "from server" : source === "estimate" ? "estimated" : "idle"}`,
  );
</script>

<div class="context-meter" title={`${Math.round(used).toLocaleString()} / ${Math.round(limit).toLocaleString()} tokens (${source === "server" ? "reported by API" : source === "estimate" ? "~estimated" : "no run yet"})`}>
  <svg
    class="context-meter-svg"
    width="44"
    height="44"
    viewBox="0 0 40 40"
    role="img"
    aria-label={aria}
  >
    <circle class="context-meter-track" cx="20" cy="20" r={r} fill="none" />
    <circle
      class={`context-meter-arc context-meter-arc--${band}`}
      class:context-meter-arc--pulse={streaming}
      cx="20"
      cy="20"
      r={r}
      fill="none"
      stroke-linecap="round"
      stroke-dasharray={`${dash} ${c}`}
      transform="rotate(-90 20 20)"
    />
  </svg>
  <div class="context-meter-meta">
    <span class="context-meter-pct">{Math.round(pct)}%</span>
    <span class="context-meter-sublabel">{label}</span>
  </div>
</div>
