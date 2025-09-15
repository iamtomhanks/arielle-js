import { Collection } from 'chromadb';
import { Logger } from '../../../../utils/logger.js';
import { LLMProviderInterface } from '../types/llm.types.js';

export class IntentDetector {
  private readonly logger: Logger;

  constructor(
    private provider: LLMProviderInterface,
    private collection: Collection
  ) {
    this.logger = Logger.getInstance(!!process.env.DEBUG);
  }

  async detectIntents(query: string): Promise<string[]> {
    this.logger.info(`🔍 Detecting intents for query: "${query}"`);
    
    try {
      // First, check if this is a multi-intent query
      const isMultiIntent = await this.isMultiIntentQuery(query);
      
      if (!isMultiIntent) {
        this.logger.debug('Single intent detected');
        return [query];
      }

      // If multiple intents detected, break them down
      const intents = await this.breakDownIntents(query);
      this.logger.info(`✅ Detected ${intents.length} distinct intents`);
      intents.forEach((intent, i) => {
        this.logger.debug(`  ${i + 1}. ${intent}`);
      });
      
      return intents;
    } catch (error) {
      this.logger.error('Error detecting intents, falling back to single intent:', error);
      return [query];
    }
  }

  private async isMultiIntentQuery(query: string): Promise<boolean> {
    this.logger.debug('Checking if query contains multiple intents...');
    
    try {
      const detectionResult = await this.provider.query({
        collection: this.collection,
        query: `Analyze if this query contains multiple distinct intents that should be processed separately. 
        Respond with "true" if it contains multiple intents, "false" otherwise: "${query}"`,
        context: {
          examples: [
            { query: "create a customer and charge them", hasMultiple: true },
            { query: "how do I create a customer", hasMultiple: false },
            { query: "set up a payment and send receipt", hasMultiple: true },
            { query: "what's the status of my order", hasMultiple: false }
          ]
        },
        maxTokens: 10,
        temperature: 0.1,
      });

      const isMulti = detectionResult.answer.trim().toLowerCase().startsWith('true');
      this.logger.debug(`Multi-intent detection result: ${isMulti}`);
      
      return isMulti;
    } catch (error) {
      this.logger.error('Error in multi-intent detection:', error);
      return false; // Default to single intent on error
    }
  }

  private async breakDownIntents(query: string): Promise<string[]> {
    this.logger.debug('Breaking down query into individual intents...');
    
    try {
      const intentsResult = await this.provider.query({
        collection: this.collection,
        query: `Break down the following query into individual intents: "${query}"`,
        context: {
          instruction: 'Return each intent on a new line, prefixed with "- "',
          example: 'For "create a customer and charge them", return:\n- create a customer\n- charge them'
        },
        maxTokens: 200,
        temperature: 0.3,
      });

      // Parse the response into individual intents
      const intents = intentsResult.answer
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2).trim())
        .filter(Boolean);

      if (intents.length === 0) {
        this.logger.warn('No intents could be parsed from the response, falling back to original query');
        return [query];
      }

      return intents;
    } catch (error) {
      this.logger.error('Error breaking down intents:', error);
      return [query]; // Fallback to original query on error
    }
  }
}
