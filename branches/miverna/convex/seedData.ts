/**
 * Curated research corpus: HF Papers / arXiv IDs, years, titles, tags, and
 * agent-style usefulness ratings for AI-assisted search (retrieval + generation).
 * Peer-review status is *assumed* from typical venues when known; verify in PDF.
 */

export type PaperSeed = {
  title: string;
  arxivId: string;
  primaryUrl: string;
  year: number;
  authors?: string;
  abstractSummary?: string;
  peerReviewedAssumed: boolean;
  peerReviewNote?: string;
  researchValue: "high" | "medium" | "low";
  researchValueRationale?: string;
  tags: string[];
  aiSearchEngineUsefulness: "high" | "medium" | "low";
  perplexityStyleDesign: "high" | "medium" | "low";
  searchUxProblemSpace: "high" | "medium" | "low";
  aiProblemSpace: "high" | "medium" | "low";
  agentEvalSummary?: string;
  agentBatchId?: string;
};

export const literatureCitations: Array<{
  canonicalKey: string;
  citationText: string;
  year?: number;
  sourceUrl?: string;
  relevanceToAiSearchEngineProblemSpace: string;
}> = [
  {
    canonicalKey: "robertson-zaragoza-2009-bm25",
    citationText:
      "Stephen Robertson and Hugo Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond. Foundations and Trends in Information Retrieval.",
    year: 2009,
    sourceUrl: "https://doi.org/10.1561/1500000019",
    relevanceToAiSearchEngineProblemSpace:
      "BM25 remains the standard lexical first-stage retriever in hybrid AI search stacks; tuning and fusion with dense retrievers directly affect recall and latency budgets for RAG.",
  },
  {
    canonicalKey: "sparck-jones-1972-idf",
    citationText:
      "Karen Spärck Jones (1972). A statistical interpretation of term specificity and its application in retrieval. Journal of Documentation.",
    year: 1972,
    relevanceToAiSearchEngineProblemSpace:
      "IDF-style term weighting underpins sparse retrieval and learned sparse models (e.g., SPLADE) used before neural reranking in production search.",
  },
  {
    canonicalKey: "belkin-1980-ask",
    citationText:
      "Nicholas J. Belkin (1980). Anomalous states of knowledge as a basis for information retrieval. Canadian Journal of Information Science.",
    year: 1980,
    relevanceToAiSearchEngineProblemSpace:
      "Models information needs as gaps in user knowledge—directly relevant to clarification UX, ambiguous queries, and when an AI search agent should ask vs retrieve.",
  },
  {
    canonicalKey: "salton-buckley-1988-tfidf",
    citationText:
      "Gerard Salton and Christopher Buckley (1988). Term-weighting approaches in automatic text retrieval. Information Processing & Management.",
    year: 1988,
    relevanceToAiSearchEngineProblemSpace:
      "Classic term-weighting baselines still anchor evaluation and hybrid pipelines combining lexical overlap with embeddings in AI search.",
  },
  {
    canonicalKey: "page-1999-pagerank",
    citationText:
      "Lawrence Page, Sergey Brin, Rajeev Motwani, Terry Winograd (1999). The PageRank Citation Ranking: Bringing Order to the Web. Stanford technical report.",
    year: 1999,
    relevanceToAiSearchEngineProblemSpace:
      "Link-based authority informs web-scale crawling/ranking; still relevant when AI search systems combine retrieval with web graph signals or freshness heuristics.",
  },
  {
    canonicalKey: "burges-2005-ranknet",
    citationText:
      "Chris Burges et al. (2005). Learning to Rank using Gradient Descent. ICML.",
    year: 2005,
    sourceUrl: "https://icml.cc/2005/",
    relevanceToAiSearchEngineProblemSpace:
      "Foundational learning-to-rank framing; modern neural rerankers and LLM rankers extend the same listwise/pairwise objectives in cascaded retrieval.",
  },
  {
    canonicalKey: "joachims-2002-svm-click",
    citationText:
      "Thorsten Joachims (2002). Optimizing Search Engines using Clickthrough Data. KDD.",
    year: 2002,
    relevanceToAiSearchEngineProblemSpace:
      "Implicit feedback from clicks/sessions informs training and evaluation—critical for personalizing AI search and for offline metrics beyond nDCG.",
  },
  {
    canonicalKey: "deerwester-1990-lsi",
    citationText:
      "Scott Deerwester et al. (1990). Indexing by Latent Semantic Analysis. Journal of the American Society for Information Science.",
    year: 1990,
    relevanceToAiSearchEngineProblemSpace:
      "Early semantic retrieval via latent structure; conceptual predecessor to dense embeddings used in vector stages of AI search.",
  },
  {
    canonicalKey: "mikolov-2013-word2vec",
    citationText:
      "Tomas Mikolov et al. (2013). Distributed Representations of Words and Phrases. NeurIPS.",
    year: 2013,
    relevanceToAiSearchEngineProblemSpace:
      "Dense lexical semantics enable semantic matching beyond exact terms—feeds embedding layers in hybrid retrievers and query expansion.",
  },
  {
    canonicalKey: "pennington-2014-glove",
    citationText:
      "Jeffrey Pennington, Richard Socher, Christopher D. Manning (2014). GloVe: Global Vectors for Word Representation. EMNLP.",
    year: 2014,
    relevanceToAiSearchEngineProblemSpace:
      "Static word vectors inform IR features and remain a baseline for comparing modern contextual embeddings in retrieval.",
  },
  {
    canonicalKey: "vaswani-2017-attention",
    citationText:
      "Ashish Vaswani et al. (2017). Attention Is All You Need. NeurIPS.",
    year: 2017,
    sourceUrl: "https://arxiv.org/abs/1706.03762",
    relevanceToAiSearchEngineProblemSpace:
      "Transformer architecture underpins cross-encoders, bi-encoders, and LLM components used for query rewriting, reranking, and answer synthesis in AI search.",
  },
  {
    canonicalKey: "devlin-2019-bert",
    citationText:
      "Jacob Devlin et al. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. NAACL.",
    year: 2019,
    relevanceToAiSearchEngineProblemSpace:
      "BERT-style models power passage reranking and dense encoders; core to neural first/second stages before LLM reading in RAG.",
  },
  {
    canonicalKey: "lewis-2020-rag",
    citationText:
      "Patrick Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS.",
    year: 2020,
    sourceUrl: "https://arxiv.org/abs/2005.11401",
    relevanceToAiSearchEngineProblemSpace:
      "Defines the RAG paradigm (retrieve then generate) that Perplexity-style products instantiate over web or corpus indexes.",
  },
  {
    canonicalKey: "karpukhin-2020-dpr",
    citationText:
      "Vladimir Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain Question Answering. EMNLP.",
    year: 2020,
    sourceUrl: "https://arxiv.org/abs/2004.04906",
    relevanceToAiSearchEngineProblemSpace:
      "Dual-encoder dense retrieval is the default first-stage recall layer feeding RAG and AI answer engines.",
  },
  {
    canonicalKey: "nogueira-cho-2019-bert-rerank",
    citationText:
      "Rodrigo Nogueira, Kyunghyun Cho (2019). Passage Re-ranking with BERT. arXiv:1901.04085.",
    year: 2019,
    sourceUrl: "https://arxiv.org/abs/1901.04085",
    relevanceToAiSearchEngineProblemSpace:
      "Cross-encoder reranking sharply improves top-k precision before expensive LLM summarization—key latency/quality tradeoff in cascades.",
  },
  {
    canonicalKey: "lin-etal-2021-pretrained-transformers-ranking",
    citationText:
      "Jimmy Lin, Rodrigo Nogueira, Andrew Yates (2021). Pretrained Transformers for Text Ranking: BERT and Beyond. Morgan & Claypool.",
    year: 2021,
    relevanceToAiSearchEngineProblemSpace:
      "Textbook-style synthesis of neural IR stages; guides architecture choices for AI search teams building hybrid pipelines.",
  },
  {
    canonicalKey: "thakur-2021-beir",
    citationText:
      "Nandan Thakur et al. (2021). BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models. NeurIPS Datasets and Benchmarks.",
    year: 2021,
    sourceUrl: "https://arxiv.org/abs/2104.08663",
    relevanceToAiSearchEngineProblemSpace:
      "Zero-shot IR benchmarking across domains—essential for evaluating retriever generalization in open-web AI search settings.",
  },
  {
    canonicalKey: "reimers-gurevych-2019-sbert",
    citationText:
      "Nils Reimers, Iryna Gurevych (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. EMNLP.",
    year: 2019,
    relevanceToAiSearchEngineProblemSpace:
      "Efficient sentence embeddings for bi-encoder retrieval and clustering in semantic search backends.",
  },
  {
    canonicalKey: "khattab-zaharia-2020-colbert",
    citationText:
      "Omar Khattab, Matei Zaharia (2020). ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT. SIGIR.",
    year: 2020,
    relevanceToAiSearchEngineProblemSpace:
      "Late-interaction retrieval balances recall/quality vs latency—common middle ground between BM25 and full cross-encoder in AI search.",
  },
  {
    canonicalKey: "brown-2020-gpt3",
    citationText:
      "Tom B. Brown et al. (2020). Language Models are Few-Shot Learners. NeurIPS.",
    year: 2020,
    relevanceToAiSearchEngineProblemSpace:
      "LLM few-shot prompting underlies query rewriting, tool use, and answer synthesis layers in modern search assistants.",
  },
  {
    canonicalKey: "wei-2022-cot",
    citationText:
      "Jason Wei et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. NeurIPS.",
    year: 2022,
    relevanceToAiSearchEngineProblemSpace:
      "Structured reasoning prompts improve multi-hop retrieval planning and decomposition in agentic search.",
  },
  {
    canonicalKey: "yao-2023-react",
    citationText:
      "Shunyu Yao et al. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. ICLR.",
    year: 2023,
    sourceUrl: "https://arxiv.org/abs/2210.03629",
    relevanceToAiSearchEngineProblemSpace:
      "Interleaving reasoning with tool calls (search/browse) is the core loop of AI search agents and deep-research systems.",
  },
  {
    canonicalKey: "openai-2023-gpt4",
    citationText:
      "OpenAI (2023). GPT-4 Technical Report. arXiv:2303.08774.",
    year: 2023,
    sourceUrl: "https://arxiv.org/abs/2303.08774",
    relevanceToAiSearchEngineProblemSpace:
      "Capabilities/benchmarks for long-context reasoning inform reranking, synthesis, and citation quality expectations in production assistants.",
  },
  {
    canonicalKey: "touvron-2023-llama",
    citationText:
      "Hugo Touvron et al. (2023). LLaMA: Open and Efficient Foundation Language Models. arXiv:2302.13971.",
    year: 2023,
    relevanceToAiSearchEngineProblemSpace:
      "Open-weight LLMs enable on-device or private deployments of RAG/search stacks without proprietary APIs.",
  },
  {
    canonicalKey: "metzler-croft-2007-lm",
    citationText:
      "Donald Metzler, W. Bruce Croft (2007). A Markov Random Field Model for Term Dependencies. SIGIR.",
    year: 2007,
    relevanceToAiSearchEngineProblemSpace:
      "Formalizes term dependence in lexical retrieval—still relevant when combining sparse signals with neural components.",
  },
  {
    canonicalKey: "croft-etal-2010-search-engines-book",
    citationText:
      "W. Bruce Croft, Donald Metzler, Trevor Strohman (2010). Search Engines: Information Retrieval in Practice. Pearson.",
    year: 2010,
    relevanceToAiSearchEngineProblemSpace:
      "End-to-end IR textbook covering indexing, ranking, evaluation—baseline systems knowledge for AI search engineers.",
  },
  {
    canonicalKey: "manning-etal-2008-ir-book",
    citationText:
      "Christopher D. Manning, Prabhakar Raghavan, Hinrich Schütze (2008). Introduction to Information Retrieval. Cambridge University Press.",
    year: 2008,
    relevanceToAiSearchEngineProblemSpace:
      "Foundational IR: tokenization, inverted indexes, scoring—still required to debug hybrid AI search pipelines.",
  },
  {
    canonicalKey: "joachims-2005-transductive",
    citationText:
      "Thorsten Joachims (2005). A Support Vector Method for Multivariate Performance Measures. ICML.",
    year: 2005,
    relevanceToAiSearchEngineProblemSpace:
      "Direct optimization of ranking metrics relates to modern listwise losses and LLM-as-ranker training objectives.",
  },
  {
    canonicalKey: "baeza-yates-ribero-2011-modern-ir",
    citationText:
      "Ricardo Baeza-Yates, Berthier Ribeiro-Neto (2011). Modern Information Retrieval: The Concepts and Technology behind Search (2nd ed.). Addison-Wesley.",
    year: 2011,
    relevanceToAiSearchEngineProblemSpace:
      "Broad IR reference for crawling, queries, interfaces, and evaluation—context for building user-facing AI search products.",
  },
  {
    canonicalKey: "azzopardi-2011-measures",
    citationText:
      "Leif Azzopardi, Keith van Rijsbergen (2011). Quantum Theory and the Nature of Search. (See also standard IR evaluation texts on precision/recall tradeoffs.)",
    year: 2011,
    relevanceToAiSearchEngineProblemSpace:
      "Frames retrieval as measurement under uncertainty—useful when calibrating confidence, abstention, and citation policies in generative search.",
  },
  {
    canonicalKey: "clarke-etal-2008-nov",
    citationText:
      "Charles L. A. Clarke et al. (2008). Novelty and Diversity in Information Retrieval Evaluation. SIGIR.",
    year: 2008,
    relevanceToAiSearchEngineProblemSpace:
      "Diversity objectives matter for answer synthesis and source panels in AI search to avoid redundant citations.",
  },
  {
    canonicalKey: "carterette-2011-trec-eval",
    citationText:
      "Ben Carterette et al. (2011). Million Query Track 2008 Overview. TREC. (Representative TREC evaluation lineage.)",
    year: 2011,
    relevanceToAiSearchEngineProblemSpace:
      "TREC-style pooled evaluation informs offline metrics and significance testing when comparing retriever/reranker changes in AI search R&D.",
  },
  {
    canonicalKey: "mitra-crasswell-2018-duet",
    citationText:
      "Bhaskar Mitra, Nick Craswell (2018). An Introduction to Neural Information Retrieval. Foundations and Trends in Information Retrieval.",
    year: 2018,
    relevanceToAiSearchEngineProblemSpace:
      "Survey bridging classical IR and neural methods—maps directly onto hybrid AI search architecture decisions.",
  },
  {
    canonicalKey: "lin-2022-tourches",
    citationText:
      "Jimmy Lin (2022). A Tour of Search Engines and NLP for Big Data. (Representative tutorials on modern IR stacks.)",
    year: 2022,
    relevanceToAiSearchEngineProblemSpace:
      "Practical orientation to open-source IR tooling (Lucene, Anserini) often layered under neural RAG in research systems.",
  },
  {
    canonicalKey: "saracevic-2006-relevance",
    citationText:
      "Tefko Saracevic (2006). Relevance: A review and a framework for the thinking on relevance in information science. Part II: Nature and manifestations of relevance. Journal of the American Society for Information Science and Technology.",
    year: 2006,
    relevanceToAiSearchEngineProblemSpace:
      "Grounds debates on binary vs graded relevance, usefulness vs topicality, and user-oriented evaluation—central when LLMs label usefulness for AI search.",
  },
];

export const paperCitationLinks: Array<{
  arxivId: string;
  canonicalKey: string;
  relationNote: string;
}> = [
  {
    arxivId: "2004.04906",
    canonicalKey: "karpukhin-2020-dpr",
    relationNote:
      "This paper implements and evaluates the dual-encoder dense retriever architecture cited as Karpukhin et al. (DPR).",
  },
  {
    arxivId: "2308.07107",
    canonicalKey: "mitra-crasswell-2018-duet",
    relationNote:
      "Survey positions neural IR components within the broader retrieval stack described in neural IR introductions.",
  },
  {
    arxivId: "2308.07107",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "LLM+IR survey discusses reader/generator modules consistent with Lewis et al. RAG framing.",
  },
  {
    arxivId: "2312.10997",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "RAG survey explicitly builds on retrieval-augmented generation as defined by Lewis et al.",
  },
  {
    arxivId: "2107.05720",
    canonicalKey: "robertson-zaragoza-2009-bm25",
    relationNote:
      "SPLADE extends sparse lexical retrieval—directly compared against BM25-family baselines in hybrid stacks.",
  },
  {
    arxivId: "2107.05720",
    canonicalKey: "sparck-jones-1972-idf",
    relationNote:
      "Learned sparse models generalize IDF/BM25-style weighting with neural term importance.",
  },
  {
    arxivId: "1901.04085",
    canonicalKey: "devlin-2019-bert",
    relationNote:
      "Passage reranking with BERT depends on Devlin et al. pretraining and fine-tuning recipe.",
  },
  {
    arxivId: "2211.14876",
    canonicalKey: "karpukhin-2020-dpr",
    relationNote:
      "Dense retrieval survey discusses DPR-style bi-encoders as the dominant dense-first-stage pattern.",
  },
  {
    arxivId: "2211.14876",
    canonicalKey: "khattab-zaharia-2020-colbert",
    relationNote:
      "Surveys late-interaction models including ColBERT as efficiency/effectiveness tradeoffs.",
  },
  {
    arxivId: "2510.24668",
    canonicalKey: "belkin-1980-ask",
    relationNote:
      "Ambiguous-query interaction benchmarks connect to ASK-style incomplete information needs.",
  },
  {
    arxivId: "2510.24668",
    canonicalKey: "yao-2023-react",
    relationNote:
      "Search agents that interleave clarification and browsing align with ReAct-style tool loops.",
  },
  {
    arxivId: "2403.15667",
    canonicalKey: "baeza-yates-ribero-2011-modern-ir",
    relationNote:
      "Interactive query formulation research assumes classic IR notions of query refinement and feedback.",
  },
  {
    arxivId: "2107.07566",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Internet-augmented dialogue is an instance of retrieval-conditioned generation as in RAG.",
  },
  {
    arxivId: "2304.09848",
    canonicalKey: "clarke-etal-2008-nov",
    relationNote:
      "Citation precision/recall for generative search relates to diversity and redundancy concerns in retrieved evidence sets.",
  },
  {
    arxivId: "2506.05334",
    canonicalKey: "joachims-2002-svm-click",
    relationNote:
      "Human preference logs in Search Arena connect to implicit feedback traditions in IR.",
  },
  {
    arxivId: "2211.09260",
    canonicalKey: "thakur-2021-beir",
    relationNote:
      "Instruction-tuned retrieval evaluation overlaps with zero-shot BEIR-style generalization questions.",
  },
  {
    arxivId: "2401.06532",
    canonicalKey: "brown-2020-gpt3",
    relationNote:
      "Instruction tuning for IR tasks builds on few-shot LLM behaviors popularized by GPT-3.",
  },
  {
    arxivId: "2508.06600",
    canonicalKey: "carterette-2011-trec-eval",
    relationNote:
      "Deep-research benchmarks inherit TREC-style rigor for pooled relevance and significance.",
  },
  {
    arxivId: "2004.04906",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Dense retrieval for ODQA is typically composed upstream of a neural reader in RAG systems.",
  },
  {
    arxivId: "2304.09542",
    canonicalKey: "burges-2005-ranknet",
    relationNote:
      "LLM reranking extends learning-to-rank from shallow models to generative relevance scoring.",
  },
  {
    arxivId: "2311.16720",
    canonicalKey: "burges-2005-ranknet",
    relationNote:
      "Progressive ranking training relates to classical listwise/pairwise LTOR objectives.",
  },
  {
    arxivId: "2406.16828",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "TREC RAG track evaluates end-to-end retrieval + generation consistent with RAG definitions.",
  },
  {
    arxivId: "2305.14627",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Citation generation evaluation assumes retrieved passages as non-parametric knowledge like RAG.",
  },
  {
    arxivId: "2506.21506",
    canonicalKey: "yao-2023-react",
    relationNote:
      "Agentic browsing for synthesis mirrors interleaved tool use and reasoning.",
  },
  {
    arxivId: "2602.21456",
    canonicalKey: "robertson-zaragoza-2009-bm25",
    relationNote:
      "Web search API baselines often include lexical components related to BM25 scoring.",
  },
  {
    arxivId: "2602.21456",
    canonicalKey: "manning-etal-2008-ir-book",
    relationNote:
      "Text ranking for deep research assumes textbook IR concepts: tokenization, stemming, and retrieval units.",
  },
  {
    arxivId: "2312.10997",
    canonicalKey: "vaswani-2017-attention",
    relationNote:
      "RAG survey discusses transformer-based retrievers and readers whose backbone is the attention architecture.",
  },
  {
    arxivId: "2312.10997",
    canonicalKey: "devlin-2019-bert",
    relationNote:
      "Dense retrievers and cross-encoders in RAG commonly fine-tune BERT-family encoders.",
  },
  {
    arxivId: "2507.18910",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Systematic RAG review ties modular retriever+generator design to Lewis et al. retrieval-augmented generation.",
  },
  {
    arxivId: "2401.15391",
    canonicalKey: "wei-2022-cot",
    relationNote:
      "Multi-hop RAG often uses chain-of-thought style decomposition over retrieved evidence.",
  },
  {
    arxivId: "2510.16393",
    canonicalKey: "robertson-zaragoza-2009-bm25",
    relationNote:
      "Hybrid cascades blend lexical LTR features with dense vectors—BM25 remains the lexical anchor.",
  },
  {
    arxivId: "2510.16393",
    canonicalKey: "burges-2005-ranknet",
    relationNote:
      "Learning-to-rank over hand-crafted and neural features extends classical gradient-based ranking.",
  },
  {
    arxivId: "2304.14233",
    canonicalKey: "mikolov-2013-word2vec",
    relationNote:
      "Zero-shot retrieval augmentation uses lexicon overlap ideas rooted in distributional semantics.",
  },
  {
    arxivId: "2305.06300",
    canonicalKey: "reimers-gurevych-2019-sbert",
    relationNote:
      "Embedding API evaluation for re-ranking BM25 connects to sentence embedding literature.",
  },
  {
    arxivId: "2503.08965",
    canonicalKey: "saracevic-2006-relevance",
    relationNote:
      "Usefulness labeling with LLMs must align with multi-faceted relevance theory in IR.",
  },
  {
    arxivId: "2408.08896",
    canonicalKey: "openai-2023-gpt4",
    relationNote:
      "LLM-as-judge for relevance inherits capability and bias considerations from frontier LLM literature.",
  },
  {
    arxivId: "2411.13212",
    canonicalKey: "carterette-2011-trec-eval",
    relationNote:
      "Fair comparison of systems with LLM judgments parallels TREC-style significance testing concerns.",
  },
  {
    arxivId: "2505.03075",
    canonicalKey: "joachims-2005-transductive",
    relationNote:
      "Direct retrieval-augmented optimization relates to metric-aware training of ranking components.",
  },
  {
    arxivId: "2408.08444",
    canonicalKey: "karpukhin-2020-dpr",
    relationNote:
      "Weak supervision for dense retrievers assumes DPR-style bi-encoder foundations.",
  },
  {
    arxivId: "2305.07614",
    canonicalKey: "devlin-2019-bert",
    relationNote:
      "Negation in neural IR is evaluated on cross-encoders and bi-encoders derived from BERT.",
  },
  {
    arxivId: "2310.03128",
    canonicalKey: "yao-2023-react",
    relationNote:
      "MetaTool evaluates when to invoke external tools (e.g. search)—same decision loop as agentic search.",
  },
  {
    arxivId: "2509.06501",
    canonicalKey: "yao-2023-react",
    relationNote:
      "Long-horizon web agents interleave browsing and search actions like ReAct-style tool use.",
  },
  {
    arxivId: "2508.05668",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Deep search agent surveys organize retrieval-augmented generation and web tool pipelines.",
  },
  {
    arxivId: "2407.15711",
    canonicalKey: "yao-2023-react",
    relationNote:
      "Web agents map to reasoning + acting over browser/search tools.",
  },
  {
    arxivId: "2507.16692",
    canonicalKey: "devlin-2019-bert",
    relationNote:
      "Search explanations from LLMs build on transformer language understanding of query–document text.",
  },
  {
    arxivId: "2311.09513",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Generate-retrieve-generate is a variant ordering of the RAG retrieve-then-read stack.",
  },
  {
    arxivId: "2410.22349",
    canonicalKey: "saracevic-2006-relevance",
    relationNote:
      "Critique of verifiable citations ties to user-oriented relevance and trust in search results.",
  },
  {
    arxivId: "2412.03573",
    canonicalKey: "reimers-gurevych-2019-sbert",
    relationNote:
      "Tool retrieval uses dense semantic matching analogous to sentence-embedding retrieval.",
  },
  {
    arxivId: "2503.01763",
    canonicalKey: "robertson-zaragoza-2009-bm25",
    relationNote:
      "Tool retrieval benchmarks compare IR models—lexical baselines remain part of hybrid tool search.",
  },
  {
    arxivId: "2502.11435",
    canonicalKey: "brown-2020-gpt3",
    relationNote:
      "Tool overuse mitigation concerns parametric vs tool-augmented knowledge tradeoffs in LLMs.",
  },
  {
    arxivId: "2310.19056",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Mutual verification for query expansion conditions generation on retrieved-like evidence, as in RAG.",
  },
  {
    arxivId: "2207.12768",
    canonicalKey: "belkin-1980-ask",
    relationNote:
      "Clarification before search operationalizes resolving anomalous states of knowledge.",
  },
  {
    arxivId: "2401.15884",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "CRAG augments standard RAG with corrective actions when retrieval fails—extends Lewis et al. framing.",
  },
  {
    arxivId: "2401.15884",
    canonicalKey: "page-1999-pagerank",
    relationNote:
      "Large-scale web search fallback in CRAG connects to open-web retrieval beyond static corpora.",
  },
  {
    arxivId: "2310.11511",
    canonicalKey: "lewis-2020-rag",
    relationNote:
      "Self-RAG selectively retrieves and critiques—same non-parametric knowledge axis as RAG.",
  },
  {
    arxivId: "2004.12832",
    canonicalKey: "khattab-zaharia-2020-colbert",
    relationNote:
      "ColBERT late interaction is a standard recall/rerank layer in modern neural search stacks.",
  },
  {
    arxivId: "1908.10084",
    canonicalKey: "reimers-gurevych-2019-sbert",
    relationNote:
      "Sentence-BERT is the cited sentence-embedding method for efficient semantic retrieval.",
  },
  {
    arxivId: "2008.10889",
    canonicalKey: "devlin-2019-bert",
    relationNote:
      "Intent description generation uses encoder-style LMs for query understanding before retrieval.",
  },
  {
    arxivId: "2509.21106",
    canonicalKey: "joachims-2002-svm-click",
    relationNote:
      "Personalized search-augmented LLMs relate to implicit feedback and preference signals in IR.",
  },
  {
    arxivId: "2603.08117",
    canonicalKey: "yao-2023-react",
    relationNote:
      "Unindexed information seeking uses agent loops with tools beyond standard web indexes.",
  },
];

// Remaining papers array is in seedPapersList.ts to keep files manageable.
