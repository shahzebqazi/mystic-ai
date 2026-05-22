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
  <path
    d="M18 6 6 18M6 6l12 12"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
  />
</svg>
