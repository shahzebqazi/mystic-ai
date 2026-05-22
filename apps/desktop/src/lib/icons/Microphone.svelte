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
  <path
    d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"
  />
  <path
    d="M19 11a7 7 0 0 1-14 0M12 18v3M8 21h8"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
