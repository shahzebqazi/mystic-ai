<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }
  let { size = 22, class: className = "" }: Props = $props();
</script>

<!-- stacked panels + bubble: history / threads -->
<svg
  width={size}
  height={size}
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <path
    d="M8 4h12v10H8V4z"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"
    opacity="0.45"
  />
  <path
    d="M4 7h12v11H4V7z"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"
    fill="color-mix(in srgb, currentColor 8%, transparent)"
  />
  <path
    d="M7 11h6M7 14h4"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    opacity="0.9"
  />
</svg>
