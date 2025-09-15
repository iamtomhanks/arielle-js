import { Collection } from 'chromadb';
import { LLMProviderInterface } from '../types/llm.types.js';
import { ConversationManager } from './conversation-manager.js';

export class QueryExecutor {
  constructor(
    private provider: LLMProviderInterface,
    private collection: Collection,
    private conversationManager: ConversationManager
  ) {}

  async executeQuery(query: string) {
    return this.provider.query({
      collection: this.collection,
      query,
      context: {
        conversationHistory: this.conversationManager.getConversationHistory(5),
      },
    });
  }

  async executeBatchQueries(queries: string[]) {
    const queryPromises = queries.map(async (query) => {
      try {
        const result = await this.provider.query({
          collection: this.collection,
          query,
          context: {
            conversationHistory: this.conversationManager.getConversationHistory(5),
          },
        });
        return {
          query,
          success: true as const,
          result
        };
      } catch (error) {
        return {
          query,
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });

    return Promise.all(queryPromises);
  }
}
