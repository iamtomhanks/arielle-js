import { Collection } from 'chromadb';
import { LLMProviderInterface } from '../types/llm.types.js';

export class IntentDetector {
  constructor(
    private provider: LLMProviderInterface,
    private collection: Collection
  ) {}

  async detectIntents(query: string): Promise<string[]> {
    try {
      // First, check if this is a multi-intent query
      const isMultiIntent = await this.isMultiIntentQuery(query);
      if (!isMultiIntent) {
        return [query];
      }

      // If multiple intents detected, break them down
      return await this.breakDownIntents(query);
    } catch (error) {
      console.error('Error detecting intents, falling back to single intent:', error);
      return [query];
    }
  }

  private async isMultiIntentQuery(query: string): Promise<boolean> {
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

    return detectionResult.answer.trim().toLowerCase().startsWith('true');
  }

  private async breakDownIntents(query: string): Promise<string[]> {
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
    return intentsResult.answer
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- '))
      .map(line => line.substring(2).trim())
      .filter(Boolean);
  }
}
