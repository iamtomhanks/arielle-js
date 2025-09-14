import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider } from '../base-llm-provider.js';
import { LLMQueryOptions, LLMQueryResult } from '../types/llm.types.js';

export class GoogleGenerativeAIProvider extends BaseLLMProvider {
  private model: any;
  private generationConfig: any;

  constructor(config: any) {
    super(config, 'Google Generative AI');
    
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(config.apiKey);
    
    // Initialize the model
    this.model = genAI.getGenerativeModel({
      model: config.model || 'gemini-pro',
    });
    
    // Set generation configuration
    this.generationConfig = {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxTokens || 1000,
    };
  }

  isConfigured(): boolean {
    return this.validateConfig(['apiKey']);
  }

  async query(options: LLMQueryOptions): Promise<LLMQueryResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Generative AI provider is not properly configured');
    }

    const { collection, query, context = {} } = options;
    
    try {
      // Retrieve relevant context from ChromaDB
      const contextText = await this.retrieveContext(collection, query);
      
      // Construct the prompt with context
      const prompt = `You are a helpful assistant that helps users find and understand API endpoints.
Use the following context to answer the user's question. If you don't know the answer, say so.

Context:
${contextText}

User Question: ${query}

Answer:`;

      // Generate content
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: this.generationConfig,
      });
      
      const response = await result.response;
      const answer = response.text();
      
      return {
        answer,
        sources: [], // We can extract sources from context if needed
        metadata: {
          model: this.model.model,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount,
          },
        },
      };
    } catch (error: any) {
      this.logger.error('Error querying Google Generative AI:', error);
      throw new Error(`Failed to get response from Google Generative AI: ${error.message}`);
    }
  }
}
