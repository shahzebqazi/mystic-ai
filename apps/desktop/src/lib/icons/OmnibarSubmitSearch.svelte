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
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M4 7h9M4 12h9M4 17h6" />
  <circle cx="15.5" cy="15.5" r="3.5" />
  <path d="M18.2 18.2 21 21" />
</svg>
