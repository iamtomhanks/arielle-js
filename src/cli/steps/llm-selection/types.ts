export type LLMProvider = 'selfhosted' | 'openai' | 'google';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
}
