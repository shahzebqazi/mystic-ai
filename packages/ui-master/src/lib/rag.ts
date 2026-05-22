import type { SearxHit } from "./types";

const SYS = `You are Minerva. Answer using the numbered sources; cite as [n] after claims. If sources are empty, say so.`;

export function buildChatBody(userQuestion: string, hits: SearxHit[]): string {
  const lines = hits.map((h, i) => {
    const snip = (h.content ?? "").replace(/\s+/g, " ").trim() || "(no snippet)";
    return `[${i + 1}] ${h.title}\nURL: ${h.url}\n${snip}`;
  });
  const ctx = lines.join("\n\n");
  const user = `Question: ${userQuestion}\n\nSources:\n${ctx}`;
  return JSON.stringify({
    model: "local",
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    stream: false,
  });
}

export function parseLlmContent(responseJson: string): string {
  try {
    const o = JSON.parse(responseJson) as {
      choices?: { message?: { content?: string } }[];
    };
    return o.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}
