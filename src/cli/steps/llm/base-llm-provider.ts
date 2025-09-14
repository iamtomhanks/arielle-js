import { Logger } from '../../../utils/logger.js';
import { LLMProviderInterface, LLMQueryOptions, LLMQueryResult } from './types/llm.types.js';

export abstract class BaseLLMProvider implements LLMProviderInterface {
  protected readonly logger: Logger;
  protected readonly config: any;
  protected readonly providerName: string;

  constructor(config: any, providerName: string) {
    this.config = config;
    this.providerName = providerName;
    this.logger = Logger.getInstance(!!process.env.DEBUG);
  }

  abstract query(options: LLMQueryOptions): Promise<LLMQueryResult>;

  getProviderName(): string {
    return this.providerName;
  }

  abstract isConfigured(): boolean;

  protected validateConfig(requiredFields: string[]): boolean {
    for (const field of requiredFields) {
      if (!this.config[field]) {
        this.logger.error(`Missing required configuration for ${this.providerName}: ${field}`);
        return false;
      }
    }
    return true;
  }

  protected async retrieveContext(collection: any, query: string): Promise<string> {
    try {
      const results = await collection.query({
        queryTexts: [query],
        nResults: 5,
      });

      if (!results.documents || results.documents.length === 0) {
        return 'No relevant context found.';
      }

      // Format the context from the query results
      return results.documents[0]
        .map((doc: string, i: number) => {
          const metadata = results.metadatas?.[0]?.[i] || {};
          return `Document ${i + 1} (Score: ${results.distances?.[0]?.[i]?.toFixed(2) || 'N/A'}):
${doc}
Metadata: ${JSON.stringify(metadata, null, 2)}
`;
        })
        .join('\n---\n');
    } catch (error) {
      this.logger.error('Error retrieving context from ChromaDB:', error);
      return 'Error retrieving relevant context.';
    }
  }
}
