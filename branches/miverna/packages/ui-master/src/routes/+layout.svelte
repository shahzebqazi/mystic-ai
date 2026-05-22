<script lang="ts">
  import "../app.css";
  let { children } = $props();
</script>

<svelte:head>
  <title>Minerva</title>
</svelte:head>

{@render children()}
