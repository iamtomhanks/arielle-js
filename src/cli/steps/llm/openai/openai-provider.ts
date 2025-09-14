import OpenAI from 'openai';
import { BaseLLMProvider } from '../base-llm-provider.js';
import { LLMQueryOptions, LLMQueryResult } from '../types/llm.types.js';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: any) {
    super(config, 'OpenAI');
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.openai.com/v1',
    });
  }

  isConfigured(): boolean {
    return this.validateConfig(['apiKey']);
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      const embedding = response.data[0].embedding;
      if (!this.validateEmbedding(embedding)) {
        throw new Error('Invalid embedding dimensions');
      }
      return embedding;
    } catch (error: any) {
      this.logger.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  async query(options: LLMQueryOptions): Promise<LLMQueryResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not properly configured');
    }

    const { collection, query, context = {}, temperature = 0.7, maxTokens = 1000 } = options;

    try {
      // Retrieve relevant context from ChromaDB
      const contextText = await this.retrieveContext(collection, query);

      // Construct the prompt with context
      const messages = [
        {
          role: 'system' as const,
          content: `You are a helpful assistant that helps users find and understand API endpoints.
          Use the following context to answer the user's question. If you don't know the answer, say so.

          Context:
          ${contextText}
          `,
        },
        {
          role: 'user' as const,
          content: query,
        },
      ];

      // Make the API call
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const answer = response.choices[0]?.message?.content || 'No response from the model';

      return {
        answer,
        sources: [], // We can extract sources from context if needed
        metadata: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error: any) {
      this.logger.error('Error querying OpenAI:', error);
      throw new Error(`Failed to get response from OpenAI: ${error.message}`);
    }
  }
}
