import { queryGeneric as query } from "convex/server";
import { v } from "convex/values";

type ResearchValue = "high" | "medium" | "low";

export const listPapers = query({
  args: {
    limit: v.optional(v.number()),
    minResearchValue: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    ),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 500);
    const rows = await ctx.db.query("papers").collect();
    const order: Record<"high" | "medium" | "low", number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    const min = args.minResearchValue;
    const filtered = min
      ? rows.filter(
          (r) =>
            order[r.researchValue as ResearchValue] <= order[min as ResearchValue],
        )
      : rows;
    filtered.sort((a, b) => b.year - a.year);
    return filtered.slice(0, limit);
  },
});

export const listPapersByTag = query({
  args: { tag: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 300);
    const rows = await ctx.db.query("papers").collect();
    return rows
      .filter((p) => p.tags.includes(args.tag))
      .sort((a, b) => b.year - a.year)
      .slice(0, limit);
  },
});

export const listLiteratureCitations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("literatureCitations").collect();
  },
});

export const citationsForPaper = query({
  args: { arxivId: v.string() },
  handler: async (ctx, args) => {
    const paper = await ctx.db
      .query("papers")
      .withIndex("by_arxiv", (q) => q.eq("arxivId", args.arxivId))
      .unique();
    if (!paper) return [];
    const links = await ctx.db
      .query("paperToCitation")
      .withIndex("by_paper", (q) => q.eq("paperId", paper._id))
      .collect();
    const out = [];
    for (const link of links) {
      const citation = await ctx.db.get(link.citationId);
      if (citation) {
        out.push({ ...citation, relationNote: link.relationNote });
      }
    }
    return out;
  },
});
