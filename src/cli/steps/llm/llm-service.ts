import { Collection } from 'chromadb';
import inquirer from 'inquirer';
import { LLMFactory } from './llm-factory.js';
import { LLMConfig } from './types/llm.types.js';

export class LLMService {
  private collection: Collection;
  private llmConfig: LLMConfig;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(collection: Collection, llmConfig: LLMConfig) {
    this.collection = collection;
    this.llmConfig = llmConfig;
  }

  async startConversation() {
    console.log('\n🔍 Arielle is ready to help you with your API questions!');
    console.log('Type "exit" or "quit" to end the conversation.\n');

    while (true) {
      const { question } = await inquirer.prompt([
        {
          type: 'input',
          name: 'question',
          message: 'You:',
        },
      ]);

      if (['exit', 'quit'].includes(question.toLowerCase().trim())) {
        console.log('\n👋 Goodbye!');
        break;
      }

      if (!question.trim()) continue;

      try {
        await this.processQuery(question);
      } catch (error: any) {
        console.error('\n❌ Error:', error.message);
      }
    }
  }

  private async processQuery(query: string) {
    // Add user query to conversation history
    this.conversationHistory.push({ role: 'user', content: query });

    // Create the LLM provider
    const provider = LLMFactory.createProvider(this.llmConfig);

    // Query the LLM with conversation context
    const result = await provider.query({
      collection: this.collection,
      query: query,
      context: {
        conversationHistory: this.conversationHistory.slice(-5), // Last 5 messages for context
      },
    });

    // Display the response
    console.log('\n🤖 Arielle:', result.answer);

    // Add assistant response to conversation history
    this.conversationHistory.push({ role: 'assistant', content: result.answer });
  }
}
