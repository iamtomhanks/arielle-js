import { BaseLLMProvider } from './base-llm-provider.js';
import { GoogleGenerativeAIProvider } from './google/google-provider.js';
import { OpenAIProvider } from './openai/openai-provider.js';
import { LLMConfig } from './types/llm.types.js';

export class LLMFactory {
  /**
   * Gets the default embedding model for a provider
   */
  private static getDefaultEmbeddingModel(provider: string): string {
    const defaultModels = {
      openai: 'text-embedding-3-small',
      google: 'text-embedding-004',
      selfhosted: 'all-mpnet-base-v2' // Example for self-hosted
    };

    return defaultModels[provider as keyof typeof defaultModels] || 'text-embedding-3-small';
  }

  /**
   * Creates an LLM provider with the given configuration
   */
  static createProvider(config: LLMConfig): BaseLLMProvider {
    const commonConfig = {
      model: config.model,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      apiKey: config.apiKey,
    };

    // Set default embedding model based on provider
    const providerConfig = {
      ...commonConfig,
      embeddingModel: config.embeddingModel || this.getDefaultEmbeddingModel(config.provider),
      openaiApiKey: config.openaiApiKey
    };

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider({
          ...providerConfig,
          model: config.model || 'gpt-4',
          baseUrl: config.baseUrl,
        });

      case 'google':
        return new GoogleGenerativeAIProvider({
          ...providerConfig,
          model: config.model || 'gemini-1.5-flash-latest',
        });

      case 'selfhosted':
        throw new Error('Self-hosted LLM provider is not yet implemented');

      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
