<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }
  let { size = 22, class: className = "" }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
  <circle cx="14" cy="8" r="2.25" fill="currentColor" />
  <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
  <circle cx="9" cy="12" r="2.25" fill="currentColor" />
  <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
  <circle cx="17" cy="16" r="2.25" fill="currentColor" />
</svg>
