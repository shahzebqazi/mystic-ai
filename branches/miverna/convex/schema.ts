import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const rating = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

export default defineSchema({
  papers: defineTable({
    title: v.string(),
    arxivId: v.string(),
    primaryUrl: v.string(),
    year: v.number(),
    authors: v.optional(v.string()),
    abstractSummary: v.optional(v.string()),
    /** Curator assumption: venue peer review when noted in HF/abstract; verify per PDF */
    peerReviewedAssumed: v.boolean(),
    peerReviewNote: v.optional(v.string()),
    researchValue: rating,
    researchValueRationale: v.optional(v.string()),
    tags: v.array(v.string()),
    aiSearchEngineUsefulness: v.optional(rating),
    perplexityStyleDesign: v.optional(rating),
    searchUxProblemSpace: v.optional(rating),
    aiProblemSpace: v.optional(rating),
    agentEvalSummary: v.optional(v.string()),
    agentBatchId: v.optional(v.string()),
  })
    .index("by_year", ["year"])
    .index("by_research_value", ["researchValue"])
    .index("by_arxiv", ["arxivId"]),

  /**
   * Canonical works frequently cited in IR / search / RAG literature, with explicit
   * mapping to AI-assisted search engine problem space (retrieval, ranking, UX, safety).
   */
  literatureCitations: defineTable({
    canonicalKey: v.string(),
    citationText: v.string(),
    year: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    relevanceToAiSearchEngineProblemSpace: v.string(),
  }).index("by_key", ["canonicalKey"]),

  paperToCitation: defineTable({
    paperId: v.id("papers"),
    citationId: v.id("literatureCitations"),
    /** Why this cited work matters for AI search / RAG / UX in context of our corpus */
    relationNote: v.string(),
  })
    .index("by_paper", ["paperId"])
    .index("by_citation", ["citationId"]),
});
