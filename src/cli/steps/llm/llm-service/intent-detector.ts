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
        this.logger.info('✅ Single intent detected');
        this.logger.info(`  1. ${query}`);
        return [query];
      }

      // If multiple intents detected, break them down
      const intents = await this.breakDownIntents(query);

      if (intents.length > 1) {
        this.logger.info(`✅ Detected ${intents.length} distinct intents:`);
        intents.forEach((intent, i) => {
          this.logger.info(`  ${i + 1}. "${intent}"`);
        });
      } else if (intents.length === 1) {
        this.logger.info(`✅ Single intent after breakdown: "${intents[0]}"`);
      }

      return intents;
    } catch (error) {
      this.logger.error('Error detecting intents, falling back to single intent:', error);
      return [query];
    }
  }

  private async isMultiIntentQuery(query: string): Promise<boolean> {
    this.logger.info('Checking if query contains multiple intents...');

    try {
      const prompt = `Analyze if this query contains multiple distinct intents that should be processed separately.
Respond with "true" if it contains multiple intents, "false" otherwise.

Examples:
- "create a customer and charge them" -> true
- "how do I create a customer" -> false
- "set up a payment and send receipt" -> true
- "what's the status of my order" -> false

Query to analyze: "${query}"

Respond with only "true" or "false":`;

      const response = await this.provider.complete(prompt, {
        temperature: 0.1,
        maxTokens: 10,
      });

      const isMulti = response.trim().toLowerCase().startsWith('true');
      this.logger.info(`Multi-intent detection result: ${isMulti}`);

      return isMulti;
    } catch (error) {
      this.logger.error('Error in multi-intent detection:', error);
      return false; // Default to single intent on error
    }
  }

  private async breakDownIntents(query: string): Promise<string[]> {
    this.logger.info('Breaking down query into individual intents...');

    try {
      const prompt = `Break down the following query into individual intents.

          Example:
          Input: "create a customer and charge them"
          Output:
          - create a customer
          - charge them

          Input: "${query}"
          Output:`;

      const response = await this.provider.complete(prompt, {
        temperature: 0.3,
        maxTokens: 200,
      });

      // Parse the response into individual intents
      const intents = response
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.substring(2).trim())
        .filter(Boolean);

      if (intents.length === 0) {
        this.logger.warn(
          'No intents could be parsed from the response, falling back to original query'
        );
        return [query];
      }

      return intents;
    } catch (error) {
      this.logger.error('Error breaking down intents:', error);
      return [query]; // Fallback to original query on error
    }
  }
}
