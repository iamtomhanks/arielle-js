import { Collection } from 'chromadb';

export type LLMProvider = 'openai' | 'google' | 'selfhosted';

export interface LLMQueryResult {
  answer: string;
  sources: string[];
  metadata?: Record<string, any>;
}

export interface LLMQueryOptions {
  collection: Collection;
  query: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMProviderInterface {
  /**
   * Query the LLM with the given question and context using vector search
   */
  query(options: LLMQueryOptions): Promise<LLMQueryResult>;

  /**
   * Generate a completion for the given prompt without vector search
   */
  complete(prompt: string, options?: CompletionOptions): Promise<string>;

  /**
   * Get the name of the provider
   */
  getProviderName(): string;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  embeddingModel?: string;
  openaiApiKey?: string; // For OpenAI embeddings with other providers
}
