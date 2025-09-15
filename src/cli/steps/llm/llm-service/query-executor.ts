import { Collection } from 'chromadb';
import { Logger } from '../../../../utils/logger.js';
import { LLMProviderInterface } from '../types/llm.types.js';
import { ConversationManager } from './conversation-manager.js';

export class QueryExecutor {
  private readonly logger: Logger;

  constructor(
    private provider: LLMProviderInterface,
    private collection: Collection,
    private conversationManager: ConversationManager
  ) {
    this.logger = Logger.getInstance(!!process.env.DEBUG);
  }

  async executeQuery(query: string) {
    this.logger.info(`🔍 Executing query: "${query}"`);
    
    try {
      const startTime = Date.now();
      const result = await this.provider.query({
        collection: this.collection,
        query,
        context: {
          conversationHistory: this.conversationManager.getConversationHistory(5),
        },
      });
      
      const duration = Date.now() - startTime;
      this.logger.debug(`✅ Query executed in ${duration}ms`);
      
      if (!result.answer) {
        this.logger.warn('Query executed successfully but returned no answer');
      } else {
        this.logger.debug(`Response length: ${result.answer.length} characters`);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error executing query:', error);
      throw error;
    }
  }

  async executeBatchQueries(queries: string[]) {
    this.logger.info(`🔍 Executing batch of ${queries.length} queries`);
    const startTime = Date.now();
    
    const queryPromises = queries.map(async (query, index) => {
      const queryStartTime = Date.now();
      this.logger.debug(`  [${index + 1}/${queries.length}] Executing: "${query}"`);
      
      try {
        const result = await this.provider.query({
          collection: this.collection,
          query,
          context: {
            conversationHistory: this.conversationManager.getConversationHistory(5),
          },
        });
        
        const duration = Date.now() - queryStartTime;
        this.logger.debug(`  [${index + 1}/${queries.length}] ✅ Success (${duration}ms)`);
        
        return {
          query,
          success: true as const,
          result
        };
      } catch (error) {
        const duration = Date.now() - queryStartTime;
        this.logger.error(`  [${index + 1}/${queries.length}] ❌ Failed after ${duration}ms:`, error);
        
        return {
          query,
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });

    const results = await Promise.all(queryPromises);
    const successCount = results.filter(r => r.success).length;
    const totalDuration = Date.now() - startTime;
    
    this.logger.info(`✅ Batch completed: ${successCount}/${queries.length} successful (${totalDuration}ms)`);
    
    return results;
  }
}
