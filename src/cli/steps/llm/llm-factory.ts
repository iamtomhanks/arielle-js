import { BaseLLMProvider } from './base-llm-provider.js';
import { GoogleGenerativeAIProvider } from './google/google-provider.js';
import { OpenAIProvider } from './openai/openai-provider.js';
import { LLMConfig } from './types/llm.types.js';

export class LLMFactory {
  static createProvider(config: LLMConfig): BaseLLMProvider {
    const commonConfig = {
      model: config.model,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      apiKey: config.apiKey,
    };

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider({
          ...commonConfig,
          model: config.model || 'gpt-4',
          baseUrl: config.baseUrl,
        });

      case 'google':
        return new GoogleGenerativeAIProvider({
          ...commonConfig,
          model: config.model || 'gemini-1.5-flash-latest',
        });

      case 'selfhosted':
        throw new Error('Self-hosted LLM provider is not yet implemented');

      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
