import { mutationGeneric as mutation } from "convex/server";
import { literatureCitations, paperCitationLinks } from "./seedData";
import { seedPapers } from "./seedPapersList";

/**
 * Idempotent seed: upserts canonical citations + papers by arxivId, rebuilds links.
 * Run after `npx convex dev` / deploy: `npx convex run seed:seedResearchInsights`
 */
export const seedResearchInsights = mutation({
  args: {},
  handler: async (ctx) => {
    const citationIdByKey = new Map<string, string>();

    for (const c of literatureCitations) {
      const existing = await ctx.db
        .query("literatureCitations")
        .withIndex("by_key", (q) => q.eq("canonicalKey", c.canonicalKey))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          citationText: c.citationText,
          year: c.year,
          sourceUrl: c.sourceUrl,
          relevanceToAiSearchEngineProblemSpace:
            c.relevanceToAiSearchEngineProblemSpace,
        });
        citationIdByKey.set(c.canonicalKey, existing._id);
      } else {
        const id = await ctx.db.insert("literatureCitations", c);
        citationIdByKey.set(c.canonicalKey, id);
      }
    }

    const paperIdByArxiv = new Map<string, string>();

    for (const p of seedPapers) {
      const existing = await ctx.db
        .query("papers")
        .withIndex("by_arxiv", (q) => q.eq("arxivId", p.arxivId))
        .unique();
      const doc = {
        title: p.title,
        arxivId: p.arxivId,
        primaryUrl: p.primaryUrl,
        year: p.year,
        authors: p.authors,
        abstractSummary: p.abstractSummary,
        peerReviewedAssumed: p.peerReviewedAssumed,
        peerReviewNote: p.peerReviewNote,
        researchValue: p.researchValue,
        researchValueRationale: p.researchValueRationale,
        tags: p.tags,
        aiSearchEngineUsefulness: p.aiSearchEngineUsefulness,
        perplexityStyleDesign: p.perplexityStyleDesign,
        searchUxProblemSpace: p.searchUxProblemSpace,
        aiProblemSpace: p.aiProblemSpace,
        agentEvalSummary: p.agentEvalSummary,
        agentBatchId: p.agentBatchId,
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
        paperIdByArxiv.set(p.arxivId, existing._id);
      } else {
        const id = await ctx.db.insert("papers", doc);
        paperIdByArxiv.set(p.arxivId, id);
      }
    }

    const paperIdSet = new Set(Array.from(paperIdByArxiv.values()));
    const existingLinks = await ctx.db.query("paperToCitation").collect();
    for (const link of existingLinks) {
      if (paperIdSet.has(link.paperId)) {
        await ctx.db.delete(link._id);
      }
    }

    let linksInserted = 0;
    for (const link of paperCitationLinks) {
      const paperId = paperIdByArxiv.get(link.arxivId);
      const citationId = citationIdByKey.get(link.canonicalKey);
      if (!paperId || !citationId) continue;
      await ctx.db.insert("paperToCitation", {
        paperId,
        citationId,
        relationNote: link.relationNote,
      });
      linksInserted++;
    }

    return {
      ok: true as const,
      papersUpserted: seedPapers.length,
      canonicalCitations: literatureCitations.length,
      paperCitationLinksInserted: linksInserted,
    };
  },
});
