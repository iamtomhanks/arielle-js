import { Collection } from 'chromadb';
import inquirer from 'inquirer';
import { LLMFactory } from './llm-factory.js';
import { LLMConfig, LLMProviderInterface } from './types/llm.types.js';
import { detectIntents } from './detect-intents.js';
import { aggregateResults, handlePartialFailures } from './result-aggregator.js';
import { batchVectorSearch } from './vector-search.js';

export class LLMService {
  private collection: Collection;
  private llmConfig: LLMConfig;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private provider: any; // LLM provider instance

  constructor(collection: Collection, llmConfig: LLMConfig) {
    this.collection = collection;
    this.llmConfig = llmConfig;
    this.provider = LLMFactory.createProvider(llmConfig);
    
    // Log the embedding model being used
    console.log(`\n🔧 Using embedding model: ${this.provider.embeddingModel} (${this.provider.embeddingDimensions} dimensions)`);
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

    // Verify collection is valid
    if (!this.collection) {
      throw new Error('No ChromaDB collection available for querying');
    }

    try {
      // Try to get collection info to verify it's accessible
      const info = await this.collection.get();
      console.log(`\nℹ️  Collection contains ${info.ids?.length || 0} documents`);
    } catch (error) {
      console.error('\n❌ Error accessing ChromaDB collection:', error);
      throw new Error('Failed to access document database. Please make sure the API documentation was properly loaded.');
    }

    // Create the LLM provider
    const provider = LLMFactory.createProvider(this.llmConfig);
    
    // Detect if this is a multi-intent query
    const intents = await this.detectAndProcessIntents(query, provider);
    
    // If no intents were detected or only one, process as a single query
    if (intents.length <= 1) {
      const intent = intents[0] || query;
      console.log(`\n🔍 Searching documentation for: ${intent}`);
      
      const result = await this.executeQuery(provider, intent);
      const answer = result.answer || 'I could not find any relevant information.';
      
      console.log('\n🤖 Arielle:', answer);
      this.conversationHistory.push({ role: 'assistant', content: answer });
      return;
    }
    
    // Process multiple intents using batch processing
    console.log(`\n🔍 Processing ${intents.length} intents from your query...`);
    
    // Execute all queries in parallel using batch processing
    const batchResults = await this.executeBatchQueries(provider, intents);
    
    // Process results
    const results = [];
    const errors = [];
    
    for (let i = 0; i < batchResults.length; i++) {
      const { query, success, result, error } = batchResults[i];
      const intent = intents[i];
      
      if (success) {
        results.push({ intent, result });
      } else {
        console.error(`  ❌ Error processing intent: ${intent}`, error);
        errors.push({ intent, error });
      }
    }
    
    // Combine and display results
    const combinedResults = aggregateResults(results);
    console.log('\n🤖 Arielle:', combinedResults);
    
    // Handle any partial failures
    if (errors.length > 0) {
      const errorMessage = handlePartialFailures(results, errors);
      if (errorMessage) {
        console.log('\n⚠️', errorMessage);
      }
    }
    
    // Add the combined response to conversation history
    this.conversationHistory.push({ role: 'assistant', content: combinedResults });
  }
  
  /**
   * Detects and processes intents from a user query
   */
  private async detectAndProcessIntents(
    query: string,
    provider: LLMProviderInterface
  ): Promise<string[]> {
    try {
      // Check if this is a multi-intent query using the LLM
      const detectionResult = await provider.query({
        collection: this.collection,
        query: `Analyze if this query contains multiple distinct intents that should be processed separately. 
        Respond with "true" if it contains multiple intents, "false" otherwise: "${query}"`,
        context: {
          examples: [
            { query: "create a customer and charge them", hasMultiple: true },
            { query: "how do I create a customer", hasMultiple: false },
            { query: "set up a payment and send receipt", hasMultiple: true },
            { query: "what's the status of my order", hasMultiple: false }
          ]
        },
        maxTokens: 10,
        temperature: 0.1,
      });
      
      const hasMultipleIntents = detectionResult.answer.trim().toLowerCase().startsWith('true');
      
      if (!hasMultipleIntents) {
        return [query];
      }
      
      // If multiple intents detected, use the LLM to break them down
      const intentsResult = await provider.query({
        collection: this.collection,
        query: `Break down the following query into individual intents: "${query}"`,
        context: {
          instruction: 'Return each intent on a new line, prefixed with "- "',
          example: 'For "create a customer and charge them", return:\n- create a customer\n- charge them'
        },
        maxTokens: 200,
        temperature: 0.3,
      });
      
      // Parse the response into individual intents
      const intents = intentsResult.answer
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2).trim())
        .filter(Boolean);
      
      return intents.length > 0 ? intents : [query];
    } catch (error) {
      console.error('Error detecting intents, falling back to single intent:', error);
      return [query];
    }
  }
  
  /**
   * Executes a single query against the LLM
   */
  private async executeQuery(
    provider: LLMProviderInterface,
    query: string
  ) {
    // Process the query through the LLM
    return await provider.query({
      collection: this.collection,
      query: query,
      context: {
        conversationHistory: this.conversationHistory.slice(-5),
      },
    });
  }
  
  /**
   * Execute multiple queries in parallel
   */
  private async executeBatchQueries(
    provider: LLMProviderInterface,
    queries: string[]
  ) {
    // Process all queries in parallel
    const queryPromises = queries.map(async (query) => {
      try {
        const result = await provider.query({
          collection: this.collection,
          query,
          context: {
            conversationHistory: this.conversationHistory.slice(-5),
          },
        });
        return {
          query,
          success: true as const,
          result
        };
      } catch (error) {
        return {
          query,
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });
    
    // Wait for all queries to complete
    return await Promise.all(queryPromises);
  }
}
