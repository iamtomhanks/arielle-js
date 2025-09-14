import inquirer from 'inquirer';
import { LLMConfig, LLMProvider } from './types.js';
import { LLMFactory } from '../llm/llm-factory.js';

type LLMChoice = {
  name: string;
  value: LLMProvider | 'choose';
  description: string;
};

// Get the default embedding model for a provider
function getDefaultEmbeddingModel(provider: string): string {
  const defaultModels = {
    openai: 'text-embedding-3-small',
    google: 'text-embedding-004',
    selfhosted: 'all-mpnet-base-v2'
  };
  return defaultModels[provider as keyof typeof defaultModels] || 'text-embedding-3-small';
}

const LLM_CHOICES: (LLMChoice & { embeddingModel: string })[] = [
  {
    name: 'Local LLM (recommended for internal APIs)',
    value: 'selfhosted',
    description: 'Use a self-hosted LLM for maximum privacy',
    embeddingModel: getDefaultEmbeddingModel('selfhosted')
  },
  {
    name: 'OpenAI',
    value: 'openai',
    description: 'Use OpenAI models (requires API key)',
    embeddingModel: getDefaultEmbeddingModel('openai')
  },
  {
    name: 'Google Generative AI',
    value: 'google',
    description: 'Use Google\'s Generative AI (requires API key)',
    embeddingModel: getDefaultEmbeddingModel('google')
  },
];

export async function promptForLLMSelection(): Promise<LLMConfig> {
  const { provider } = await inquirer.prompt<{ provider: LLMProvider }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select an LLM provider:',
      choices: LLM_CHOICES.map(choice => {
        const selectedChoice = LLM_CHOICES.find(c => c.value === choice.value);
        return {
          name: `${choice.name} - ${choice.description} (Embeddings: ${selectedChoice?.embeddingModel})`,
          value: choice.value,
        };
      }),
    },
  ]);
  
  // Get the selected choice to access embedding model
  const selectedChoice = LLM_CHOICES.find(c => c.value === provider);
  const embeddingModel = selectedChoice?.embeddingModel || getDefaultEmbeddingModel(provider);
  
  // For non-OpenAI providers, ask if they want to use OpenAI embeddings
  let openaiApiKey: string | undefined;
  if (provider !== 'openai') {
    const { useOpenAIEmbeddings } = await inquirer.prompt<{ useOpenAIEmbeddings: boolean }>([
      {
        type: 'confirm',
        name: 'useOpenAIEmbeddings',
        message: `Would you like to use OpenAI embeddings (recommended for better results)?`,
        default: true,
      },
    ]);
    
    if (useOpenAIEmbeddings) {
      const { key } = await inquirer.prompt<{ key: string }>([
        {
          type: 'password',
          name: 'key',
          message: 'Enter your OpenAI API key for embeddings:',
          mask: '*',
          validate: (input: string) => {
            if (!input || input.trim() === '') {
              return 'Please enter a valid API key';
            }
            return true;
          },
        },
      ]);
      openaiApiKey = key;
    }
  }

  // Handle API key prompts based on provider
  if (provider === 'openai') {
    const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenAI API key:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return 'Please enter a valid API key';
          }
          return true;
        },
      },
    ]);
    return {
      provider,
      ...(apiKey && { apiKey }),
      embeddingModel,
      ...(openaiApiKey && { openaiApiKey }),
    };
  }
  
  if (provider === 'google') {
    const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Google Generative AI API key:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return 'Please enter a valid API key';
          }
          return true;
        },
      },
    ]);
    return { provider, apiKey };
  }

  return { provider };
}
