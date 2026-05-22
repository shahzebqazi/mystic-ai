<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }
  let { size = 18, class: className = "" }: Props = $props();
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
    x="8"
    y="8"
    width="12"
    height="12"
    rx="2"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"
  />
  <path
    d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
