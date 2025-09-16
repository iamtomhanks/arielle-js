import { Collection } from 'chromadb';
import inquirer from 'inquirer';
import { Logger } from '../../../../utils/logger.js';
import { LLMFactory } from '../llm-factory.js';
import { LLMConfig } from '../types/llm.types.js';
import { ConversationManager } from './conversation-manager.js';
import { IntentDetector } from './intent-detector.js';
import { QueryExecutor } from './query-executor.js';
import { LLMServiceOptions } from './types.js';

export class LLMService {
  private collection: Collection;
  private llmConfig: LLMConfig;
  private conversationManager: ConversationManager;
  private intentDetector: IntentDetector;
  private queryExecutor: QueryExecutor;

  constructor(options: LLMServiceOptions) {
    this.collection = options.collection;
    this.llmConfig = options.llmConfig;
    const provider = LLMFactory.createProvider(this.llmConfig);

    this.conversationManager = new ConversationManager();
    this.intentDetector = new IntentDetector(provider, this.collection);
    this.queryExecutor = new QueryExecutor(provider, this.collection, this.conversationManager);

    console.log(`\n🔧 LLM Service initialized with provider: ${provider.getProviderName()}`);
  }

  async processQuery(query: string) {
    this.conversationManager.addMessage('user', query);
    const logger = Logger.getInstance(!!process.env.DEBUG);

    try {
      logger.info('🔍 Starting to process query...');
      logger.debug(`Raw query: "${query}"`);

      // Verify collection is accessible
      await this.verifyCollectionAccess();

      // Detect intents
      logger.info('🔍 Analyzing query for multiple intents...');
      let intents = await this.intentDetector.detectIntents(query);

      // Add 'what are all the ways as a prefix'
      intents = intents.map((intent) => `What are all of the ways that I can ${intent}`);

      // Log the final list of intents to be processed
      if (intents.length > 1) {
        logger.info(`✅ Will process ${intents.length} separate intents`);
      }

      // Process single intent
      if (intents.length <= 1) {
        const intent = intents[0] || query;
        logger.info(`🔍 Processing intent: "${intent}"`);

        const result = await this.queryExecutor.executeQuery(intent);
        const answer = result.answer || 'I could not find any relevant information.';

        logger.debug('Generated response successfully');
        console.log('\n🤖 Arielle:', answer);
        this.conversationManager.addMessage('assistant', answer);
        return;
      }

      // Process multiple intents
      logger.info(`Processing ${intents.length} intents in parallel...`);
      const batchResults = await this.queryExecutor.executeBatchQueries(intents);

      // Filter out failed queries and log them
      const failedQueries = batchResults.filter(r => !r.success);
      if (failedQueries.length > 0) {
        logger.warn(`Failed to process ${failedQueries.length} intents`);
        failedQueries.forEach(({ query, error }, index) => {
          logger.warn(`  ${index + 1}. "${query}" - ${error?.message || 'Unknown error'}`);
        });
      }

      // Get successful results
      const successfulResults = batchResults.filter(r => r.success);
      
      if (successfulResults.length === 0) {
        const errorMessage = 'Failed to process any of the intents. Please try again.';
        console.log('\n🤖 Arielle:', errorMessage);
        this.conversationManager.addMessage('assistant', errorMessage);
        return;
      }

      // Format and display results
      logger.debug('Formatting results...');
      const combinedResults = this.formatResults(batchResults, intents);

      logger.info('All intents processed successfully');
      console.log('\n🤖 Arielle:', combinedResults);
      this.conversationManager.addMessage('assistant', combinedResults);
    } catch (error) {
      console.error(
        '\n❌ Error:',
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
      this.conversationManager.addMessage(
        'assistant',
        'I encountered an error processing your request.'
      );
    }
  }

  private async verifyCollectionAccess() {
    const logger = Logger.getInstance(!!process.env.DEBUG);
    logger.debug('Verifying collection access...');

    try {
      const info = await this.collection.get();
      const docCount = info.ids?.length || 0;
      logger.info(`Collection contains ${docCount} documents`);

      if (docCount === 0) {
        logger.warn('Collection is empty. This may affect query results.');
      }
    } catch (error) {
      logger.error('Error accessing collection:', error);
      throw new Error(
        'Failed to access document database. Please make sure the API documentation was properly loaded.'
      );
    }
  }

  async startConversation() {
    const logger = Logger.getInstance(!!process.env.DEBUG);
    console.log('\n🔍 Arielle is ready to help you with your API questions!');
    console.log('Type "exit" or "quit" to end the conversation.\n');

    while (true) {
      try {
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

        logger.info(`Processing question: "${question}"`);
        await this.processQuery(question);
      } catch (error: any) {
        logger.error('Error in conversation:', error);
        console.error('\n❌ Error:', error.message);
      }
    }
  }

  private formatResults(batchResults: Array<{query: string, success: boolean, result?: any, error?: Error}>, intents: string[]) {
    if (batchResults.length === 0) return 'No results found for your query.';
    
    const sections = batchResults.map((item, index) => {
      if (!item.success) {
        return `## ${index + 1}. ${intents[index]}\n\n❌ Error: ${item.error?.message || 'Unknown error'}\n`;
      }
      
      const answer = item.result?.answer;
      const sources = item.result?.sources || [];
      
      let section = `## ${index + 1}. ${intents[index]}\n\n`;
      
      if (answer) {
        section += `${answer}\n\n`;
      } else {
        section += 'No specific information found.\n\n';
      }
      
      if (sources.length > 0) {
        section += '**Sources:**\n';
        sources.forEach((source: string, i: number) => {
          section += `${i + 1}. ${source}\n`;
        });
      }
      
      return section;
    });

    return [
      '# Action Plan',
      'Based on your query, here are the steps to accomplish your goal:',
      '',
      ...sections,
      '---\nYou can ask follow-up questions about any of these steps for more details.',
    ].join('\n');
  }
}
