<script lang="ts">
  import type { WorkMode } from "$lib/chats";
  import { MODEL_OPTIONS, WORK_MODES } from "$lib/chats";

  interface Props {
    selectedModel: string;
    workMode: WorkMode;
    compact?: boolean;
  }
  let {
    selectedModel = $bindable("default"),
    workMode = $bindable("searching"),
    compact = false,
  }: Props = $props();
</script>

<div class="model-mode-bar" class:model-mode-bar--compact={compact}>
  <label class="model-field">
    <span class="model-field-label">Model</span>
    <select class="model-select" bind:value={selectedModel}>
      {#each MODEL_OPTIONS as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </label>
  <div class="mode-group" role="group" aria-label="Workflow mode">
    {#each WORK_MODES as m (m.id)}
      <button
        type="button"
        class="mode-btn"
        class:mode-btn--active={workMode === m.id}
        title={m.hint}
        aria-pressed={workMode === m.id}
        onclick={() => (workMode = m.id)}
      >
        {m.label}
      </button>
    {/each}
  </div>
</div>
