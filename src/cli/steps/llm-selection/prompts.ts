import inquirer from 'inquirer';
import { LLMConfig, LLMSelectionOptions } from './types.js';

const LOCAL_LLM_CHOICE = 'Yes, use a local LLM (recommended for internal APIs)';
const OPENAI_CHOICE = 'No, I want to use OpenAI';

export async function promptForLLMSelection(): Promise<LLMConfig> {
  const { useLocalLLM } = await inquirer.prompt<{ useLocalLLM: boolean }>([
    {
      type: 'list',
      name: 'useLocalLLM',
      message: 'Would you like to use a local LLM to protect your API information?',
      choices: [
        {
          name: LOCAL_LLM_CHOICE,
          value: true,
        },
        {
          name: OPENAI_CHOICE,
          value: false,
        },
      ],
    },
  ]);

  if (useLocalLLM) {
    return { provider: 'local' };
  }

  // If not using local LLM, prompt for OpenAI API key
  const { openAIApiKey } = await inquirer.prompt<{ openAIApiKey: string }>([
    {
      type: 'password',
      name: 'openAIApiKey',
      message: 'Enter your OpenAI API key:',
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Please enter a valid OpenAI API key';
        }
        return true;
      },
    },
  ]);

  return { provider: 'openai', openAIApiKey };
}
