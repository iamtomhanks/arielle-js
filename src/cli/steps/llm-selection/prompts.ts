import inquirer from 'inquirer';
import { LLMConfig, LLMProvider } from './types.js';

type LLMChoice = {
  name: string;
  value: LLMProvider | 'choose';
  description: string;
};

const LLM_CHOICES: LLMChoice[] = [
  {
    name: 'Local LLM (recommended for internal APIs)',
    value: 'selfhosted',
    description: 'Use a self-hosted LLM for maximum privacy',
  },
  {
    name: 'OpenAI',
    value: 'openai',
    description: 'Use OpenAI models (requires API key)',
  },
  {
    name: 'Google Generative AI',
    value: 'google',
    description: 'Use Google\'s Generative AI (requires API key)',
  },
];

export async function promptForLLMSelection(): Promise<LLMConfig> {
  const { provider } = await inquirer.prompt<{ provider: LLMProvider }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select an LLM provider:',
      choices: LLM_CHOICES.map(choice => ({
        name: `${choice.name} - ${choice.description}`,
        value: choice.value,
      })),
    },
  ]);

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
    return { provider, apiKey };
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
