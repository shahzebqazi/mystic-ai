<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }
  let { size = 20, class: className = "" }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <rect
    x="3"
    y="5"
    width="13"
    height="13"
    rx="2"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"
  />
  <circle cx="8" cy="10" r="1.25" fill="currentColor" />
  <path
    d="M3 15l3.5-3 2.5 2 3-3L16 15"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M17 7v5M14.5 9.5H19.5"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
  />
</svg>
