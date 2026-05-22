export type SearxHit = {
  title: string;
  url: string;
  content?: string;
  thumbnail?: string;
};

export type AppSettings = {
  searxBaseUrl: string;
  llamaHost: string;
  llamaPort: number;
  llmContextTokens: number;
};

export type ChatSnap = {
  id: string;
  title: string;
  updatedAt: number;
  query: string;
  answer: string;
  hitsJson: string;
};
