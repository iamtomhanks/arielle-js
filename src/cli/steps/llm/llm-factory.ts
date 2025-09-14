import { OpenAIProvider } from './openai/openai-provider.js';
import { BaseLLMProvider } from './base-llm-provider.js';
import { LLMConfig, LLMProvider } from './types/llm.types.js';

export class LLMFactory {
  static createProvider(config: LLMConfig): BaseLLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider({
          apiKey: config.apiKey,
          model: config.model || 'gpt-4',
          baseUrl: config.baseUrl,
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 1000,
        });
      
      case 'selfhosted':
        throw new Error('Self-hosted LLM provider is not yet implemented');
      
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
