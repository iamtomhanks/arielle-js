import { Collection } from 'chromadb';
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

    try {
      // Verify collection is accessible
      await this.verifyCollectionAccess();
      
      // Detect intents
      const intents = await this.intentDetector.detectIntents(query);
      
      // Process single intent
      if (intents.length <= 1) {
        const intent = intents[0] || query;
        console.log(`\n🔍 Processing query: ${intent}`);
        
        const result = await this.queryExecutor.executeQuery(intent);
        const answer = result.answer || 'I could not find any relevant information.';
        
        console.log('\n🤖 Arielle:', answer);
        this.conversationManager.addMessage('assistant', answer);
        return;
      }
      
      // Process multiple intents
      console.log(`\n🔍 Processing ${intents.length} intents from your query...`);
      const results = await this.queryExecutor.executeBatchQueries(intents);
      
      // Combine and display results
      const combinedResults = this.formatResults(results, intents);
      console.log('\n🤖 Arielle:', combinedResults);
      this.conversationManager.addMessage('assistant', combinedResults);
      
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : 'An unknown error occurred');
      this.conversationManager.addMessage('assistant', 'I encountered an error processing your request.');
    }
  }

  private async verifyCollectionAccess() {
    try {
      const info = await this.collection.get();
      console.log(`\nℹ️  Collection contains ${info.ids?.length || 0} documents`);
    } catch (error) {
      console.error('\n❌ Error accessing collection:', error);
      throw new Error('Failed to access document database. Please make sure the API documentation was properly loaded.');
    }
  }

  private formatResults(results: any[], intents: string[]) {
    if (results.length === 0) return 'No results found for your query.';
    if (results.length === 1) return results[0].answer || 'No answer found for this query.';

    const sections = results.map((result, index) => 
      `## ${index + 1}. ${intents[index]}\n\n${result.answer || 'No specific information found.'}\n`
    );

    return [
      '# Action Plan',
      'Based on your query, here are the steps to accomplish your goal:',
      '',
      ...sections,
      '---\nYou can ask follow-up questions about any of these steps for more details.'
    ].join('\n');
  }
}
