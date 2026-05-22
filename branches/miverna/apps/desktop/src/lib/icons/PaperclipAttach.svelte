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
    d="M21.44 11.05 12.25 20.24a5.56 5.56 0 1 1-7.86-7.86l9.19-9.19a3.89 3.89 0 1 1 5.5 5.5l-9.2 9.19a2.22 2.22 0 1 1-3.14-3.14l8.49-8.48"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
