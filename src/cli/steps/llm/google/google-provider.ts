import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider } from '../base-llm-provider.js';
import { LLMQueryOptions, LLMQueryResult } from '../types/llm.types.js';

export class GoogleGenerativeAIProvider extends BaseLLMProvider {
  private model: any;
  private generationConfig: any;

  constructor(config: any) {
    super(config, 'Google Generative AI');

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(config.apiKey);

    // Initialize the model
    this.model = genAI.getGenerativeModel({
      model: config.model || 'gemini-1.5-flash-latest',
    });

    // Set generation configuration
    this.generationConfig = {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxTokens || 1000,
    };
  }

  isConfigured(): boolean {
    return this.validateConfig(['apiKey']);
  }

  async query(options: LLMQueryOptions): Promise<LLMQueryResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Generative AI provider is not properly configured');
    }

    this.logger.debug('Starting Google Generative AI query with options:', {
      query: options.query,
      contextKeys: Object.keys(options.context || {}),
      model: this.model.model,
    });

    const { collection, query, context = {} } = options;

    try {
      // Retrieve relevant context from ChromaDB
      const contextText = await this.retrieveContext(collection, query);

      // Get conversation history if available
      const conversationHistory = context.conversationHistory || [];

      // Build the conversation history for context
      const historyText = conversationHistory
        .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      // Construct the prompt with context and conversation history
      const prompt = `You are a helpful assistant that helps users find and understand API endpoints.
Use the following context from the API documentation to answer the user's question.
If you don't know the answer based on the context, say so.

${historyText ? 'Previous Conversation:\n' + historyText + '\n\n' : ''}Relevant API Documentation:
${contextText}

Current Question: ${query}

Answer the question based on the API documentation above. If the information isn't in the documentation, say so.`;

      // Log the prompt being sent to the model
      this.logger.debug('Sending prompt to Google Generative AI:', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
      });

      // Generate content
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: this.generationConfig,
      });

      const response = await result.response;
      const answer = response.text();

      this.logger.debug('Received response from Google Generative AI:', {
        answerLength: answer.length,
        answerPreview: answer.substring(0, 200) + (answer.length > 200 ? '...' : ''),
      });

      return {
        answer,
        sources: [], // We can extract sources from context if needed
        metadata: {
          model: this.model.model,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount,
          },
        },
      };
    } catch (error: any) {
      this.logger.error('Error querying Google Generative AI:', error);
      throw new Error(`Failed to get response from Google Generative AI: ${error.message}`);
    }
  }
}
