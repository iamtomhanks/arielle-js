import { IncludeEnum } from 'chromadb';
import { Logger } from '../../../utils/logger.js';
import {
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_MODELS,
  validateEmbeddingDimensions,
} from './embedding-models.js';
import { CompletionOptions, LLMProviderInterface, LLMQueryOptions, LLMQueryResult } from './types/llm.types.js';
import { vectorSearch } from './vector-search.js';

export abstract class BaseLLMProvider implements LLMProviderInterface {
  public readonly logger: Logger;
  protected readonly config: any;
  protected readonly providerName: string;
  public embeddingModel: string;
  public embeddingDimensions: number;

  constructor(config: any, providerName: string) {
    this.config = config;
    this.providerName = providerName;
    this.logger = Logger.getInstance(!!process.env.DEBUG);

    // Set up embedding model
    this.embeddingModel = this.config.embeddingModel || DEFAULT_EMBEDDING_MODEL;
    this.embeddingDimensions = this.getEmbeddingDimensions(this.embeddingModel);
  }

  abstract query(options: LLMQueryOptions): Promise<LLMQueryResult>;

  /**
   * Generate a completion for the given prompt without vector search
   * @param prompt The prompt to complete
   * @param options Completion options
   */
  abstract complete(prompt: string, options?: CompletionOptions): Promise<string>;

  getProviderName(): string {
    return this.providerName;
  }

  abstract isConfigured(): boolean;

  /**
   * Gets the embedding dimensions for a specific model
   */
  protected getEmbeddingDimensions(modelName: string): number {
    const model = EMBEDDING_MODELS[modelName];
    if (!model) {
      this.logger.warn(`Unknown embedding model: ${modelName}. Using default dimensions.`);
      return EMBEDDING_MODELS[DEFAULT_EMBEDDING_MODEL].dimensions;
    }
    return model.dimensions;
  }

  /**
   * Validates if the provided embedding matches the expected dimensions
   */
  protected validateEmbedding(embedding: number[]): boolean {
    const isValid = validateEmbeddingDimensions(embedding, this.embeddingDimensions);
    if (!isValid) {
      this.logger.error(
        `Embedding dimension mismatch. Expected ${this.embeddingDimensions}, got ${embedding.length}`
      );
    }
    return isValid;
  }

  /**
   * Abstract method to generate embeddings for the given text
   * Must be implemented by each provider
   */
  public abstract generateEmbeddings(text: string): Promise<number[]>;

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
      // Use the vectorSearch function to perform the search
      const results = await vectorSearch({
        collection,
        query,
        generateEmbeddings: this.generateEmbeddings.bind(this),
        maxResults: 5,
        include: [IncludeEnum['documents'], IncludeEnum['metadatas'], IncludeEnum['distances']],
      });

      // If no results, return early
      if (!results.ids?.[0]?.length) {
        console.log('ℹ️  No matching documents found');
        return '';
      }

      // Step 4: Process results with detailed validation
      try {
        if (
          !results ||
          !results.documents ||
          results.documents.length === 0 ||
          !results.documents[0]
        ) {
          console.warn('⚠️ No documents found in query results');
          console.debug('Results object:', JSON.stringify(results, null, 2));
          return '';
        }

        const resultDocuments = results.documents[0] || [];
        const resultMetadatas = results.metadatas?.[0] || [];
        const resultDistances = results.distances?.[0] || [];

        console.log(`📊 Retrieved ${resultDocuments.length} results`);

        const filteredResultDocuments: string[] = resultDocuments.filter(
          (doc: string | null) => doc !== null
        );

        // Log details of each result

        filteredResultDocuments.forEach((doc: string, index: number) => {
          console.log(`\n📄 Result ${index + 1}:`);
          console.log(`  Document: ${doc?.substring(0, 150)}${doc?.length > 150 ? '...' : ''}`);
          console.log(`  Metadata:`, resultMetadatas[index] || 'None');
          console.log(
            `  Distance: ${resultDistances[index] !== undefined ? resultDistances[index] : 'N/A'}`
          );
        });

        // Format the context from results
        const context = filteredResultDocuments
          .map((doc: string, index: number) => {
            if (!doc) return null;
            const metadata = resultMetadatas[index] || {};
            const distance = resultDistances[index];
            const similarity =
              distance !== undefined && distance !== null ? (1 - distance).toFixed(2) : 'N/A';

            return `[${metadata.method || 'UNKNOWN'} ${metadata.path || ''} | Similarity: ${similarity}]\n${doc}`;
          })
          .filter(Boolean) // Remove any null entries
          .join('\n\n');

        if (!context) {
          console.warn('⚠️ No valid documents found after processing results');
          return '';
        }

        return context;
      } catch (processError: any) {
        console.error('❌ Error processing results:', processError);
        console.error(
          'Results object structure:',
          JSON.stringify(
            {
              documents: results?.documents?.map((d: any, i: number) => ({
                index: i,
                type: typeof d,
                isArray: Array.isArray(d),
                length: d?.length,
                firstChars: typeof d?.[0] === 'string' ? d[0]?.substring(0, 50) : 'N/A',
                fullValue: JSON.stringify(d).substring(0, 200),
              })),
              metadatas: results?.metadatas?.map((m: any, i: number) => ({
                index: i,
                type: typeof m,
                isArray: Array.isArray(m),
                length: m?.length,
                firstItem: m?.[0],
                fullValue: JSON.stringify(m).substring(0, 200),
              })),
              distances: results?.distances?.map((d: any, i: number) => ({
                index: i,
                type: typeof d,
                isArray: Array.isArray(d),
                length: d?.length,
                firstValue: d?.[0],
              })),
            },
            null,
            2
          )
        );
        throw new Error(`Failed to process query results: ${processError.message}`);
      }
    } catch (error) {
      console.error('❌ Error in retrieveContext:', error);
      throw error;
    }
  }
}
