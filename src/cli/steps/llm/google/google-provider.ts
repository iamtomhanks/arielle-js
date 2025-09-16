import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider } from '../base-llm-provider.js';
import { CompletionOptions, LLMQueryOptions, LLMQueryResult } from '../types/llm.types.js';

export class GoogleGenerativeAIProvider extends BaseLLMProvider {
  private model: any;
  private generationConfig: any;
  private embeddingModelClient: any;

  constructor(config: any) {
    super(config, 'Google Generative AI');
    const modelName = config.model || 'gemini-1.5-flash-latest';

    // Log configuration
    const configInfo =
      `Model: ${modelName}, ` +
      `Embedding: ${config.embeddingModel || 'text-embedding-004 (default)'}, ` +
      `Temp: ${config.temperature || 0.7}, ` +
      `Max Tokens: ${config.maxTokens || 1000}, ` +
      `Embed Dims: ${config.embeddingDimensions || 'Not specified'}, ` +
      `Has API Key: ${!!config.apiKey}`;
    this.logger.info(`Initializing Google Generative AI Provider with config: ${configInfo}`);

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(config.apiKey);

    // Initialize the text generation model
    this.logger.info(`Initializing text generation model: ${modelName}`);
    this.model = genAI.getGenerativeModel({
      model: modelName,
    });

    // Initialize the embedding model with the configured model
    this.embeddingModelClient = genAI;
    this.embeddingModel = config.embeddingModel || 'text-embedding-004';
    this.logger.info(
      `Using embedding model: ${this.embeddingModel} (${this.embeddingDimensions} dimensions)`
    );

    // Set generation configuration
    this.generationConfig = {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxTokens || 1000,
    };
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    try {
      this.logger.debug(`Generating completion for prompt (${prompt.length} chars)`);

      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? this.generationConfig.temperature,
          maxOutputTokens: options.maxTokens ?? this.generationConfig.maxOutputTokens,
        },
      });

      const response = await result.response;
      const text = response.text();

      this.logger.debug(`Generated completion (${text.length} chars)`);
      return text;
    } catch (error: any) {
      this.logger.error('Error generating completion:', error);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      // Log the embedding generation request
      const textPreview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
      this.logger.info(
        `Starting embedding generation - Model: ${this.embeddingModel}, ` +
          `Text: "${textPreview}" (${text.length} chars), ` +
          `Expected Dims: ${this.embeddingDimensions}`
      );

      // Get the embedding model
      const model = this.embeddingModelClient.getGenerativeModel({
        model: this.embeddingModel,
      });

      // Log before making the API call
      this.logger.debug('Calling Google Generative AI API for embeddings...');

      // Generate embeddings - let the model use its default dimensions
      const startTime = Date.now();
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        taskType: 'retrieval_document',
      });
      const duration = Date.now() - startTime;

      const embedding = result.embedding.values;

      // Log the embedding results
      this.logger.info(
        `Embedding generation completed - ` +
          `Model: ${this.embeddingModel}, ` +
          `Dimensions: ${embedding.length}, ` +
          `Duration: ${duration}ms`
      );

      // Debug log first few values if verbose logging is enabled
      if (this.logger.isVerbose) {
        this.logger.debug(`First few embedding values: ${embedding.slice(0, 3).join(', ')}...`);
      }

      if (!this.validateEmbedding(embedding)) {
        throw new Error(
          `Invalid embedding dimensions. Expected ${this.embeddingDimensions}, got ${embedding.length}`
        );
      }
      return embedding;
    } catch (error: any) {
      this.logger.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
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
