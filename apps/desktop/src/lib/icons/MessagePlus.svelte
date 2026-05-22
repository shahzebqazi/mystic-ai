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
    d="M21 12a4 4 0 0 1-4 4H8l-5 3V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4z"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"
  />
  <path
    d="M16 9v6M13 12h6"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
  />
</svg>
