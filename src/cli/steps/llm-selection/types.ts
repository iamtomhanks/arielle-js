export type LLMProvider = 'local' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  openAIApiKey?: string;
}

export interface LLMSelectionOptions {
  useLocalLLM: boolean;
  openAIApiKey?: string;
}
