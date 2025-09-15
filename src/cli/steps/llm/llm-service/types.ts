import { Collection } from 'chromadb';
import { LLMConfig, LLMProviderInterface } from '../types/llm.types.js';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export interface LLMServiceOptions {
  collection: Collection;
  llmConfig: LLMConfig;
}

export interface QueryResult {
  query: string;
  success: boolean;
  result?: any;
  error?: Error;
}
