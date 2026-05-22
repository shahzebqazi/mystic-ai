<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }
  let { size = 14, class: className = "" }: Props = $props();
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
    d="M12 3v3M12 18v3M4.5 12h3M16.5 12h3"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
  />
  <path
    d="m7 7 2.1 2.1M14.9 14.9 17 17M17 7l-2.1 2.1M9.1 14.9 7 17"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <circle cx="12" cy="12" r="2.25" fill="currentColor" opacity="0.35" />
</svg>
