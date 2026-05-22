import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** GitHub Pages project site: set MINERVA_PAGES_BASE=/repo-name (no trailing slash). Empty for local + macOS bundle. */
const pagesBase = (process.env.MINERVA_PAGES_BASE ?? "").replace(/\/$/, "");

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: "index.html",
      strict: false,
    }),
    /** Required for WKWebView `file://…/index.html` — pathname links would resolve to missing files. */
    router: {
      type: "hash",
    },
    paths: {
      base: pagesBase,
      relative: true,
    },
    prerender: {
      handleMissingId: "warn",
      entries: ["*"],
    },
  },
};

export default config;
