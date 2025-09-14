export type LLMProvider = 'selfhosted' | 'openai' | 'google';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  embeddingModel?: string;
  openaiApiKey?: string; // For OpenAI embeddings with other providers
}
