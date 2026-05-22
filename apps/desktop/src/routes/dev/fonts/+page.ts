/**
 * Font & icon inspection for visual QA.
 * Available in dev, or in production when PUBLIC_SHOW_FONT_INSPECTOR=true (build-time).
 */
import { dev } from "$app/environment";
import { env } from "$env/dynamic/public";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  if (!dev && env.PUBLIC_SHOW_FONT_INSPECTOR !== "true") {
    error(404, "Not found");
  }
  return {};
};
