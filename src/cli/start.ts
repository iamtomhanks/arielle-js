import { Command } from 'commander';
import { type Ora } from 'ora';
import { APIService } from '../modules/api/api-service.js';
import { InteractionService } from '../modules/cli/interaction-service.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';
import { UI } from '../utils/ui.js';
import { promptForLLMSelection } from './steps/llm-selection/prompts.js';
import { LLMService } from './steps/llm/llm-service.js';
import {
  createProcessingSpinner,
  displayRawResults,
  extractAndSaveToJSON,
  getOpenAPISpecPath,
  loadAndValidateSpec,
  succeedSpinner,
  updateSpinnerText,
} from './steps/open-api-spec-parsing/index.js';
import { ensureChromaDBServer } from './steps/vector-db-insert/startChromaDB.js';
import { uploadToVectorDB } from './steps/vector-db-insert/uploadToVectorDB.js';

interface StartOptions {
  verbose: boolean;
  spec?: string;
  output?: string;
  clearCache?: boolean;
  vector?: boolean;
  search?: string;
  embeddingModel?: string;
}

interface ProcessedEndpoint {
  method: string;
  path: string;
  summary?: string;
  tags?: string[];
  parameters?: any[];
}

export const startCommand = new Command('start')
  .description('Start the ArielleJS wizard')
  .option('--verbose', 'Enable verbose logging', false)
  .option('-s, --spec <path>', 'Path or URL to OpenAPI specification (YAML/JSON)')
  .option('-o, --output <path>', 'Output directory for processed data')
  .option('--no-vector', 'Disable vector database indexing', false)
  .option('--clear-cache', 'Clear existing vector database cache', false)
  .option('--search <query>', 'Search for endpoints matching the query')
  .option('--embedding-model <model>', 'Embedding model to use (e.g., text-embedding-3-small, text-embedding-004)')
  .action(async (options: StartOptions) => {
    // Show beautiful banner - this includes the welcome message
    UI.showBanner();

    if (options.verbose) {
      UI.info('Debug mode enabled');
      console.log('CLI started with options:', JSON.stringify(options, null, 2));
    }

    // Initialize services
    const logger = Logger.getInstance(options.verbose);
    const apiService = new APIService(options.verbose);
    const interactionService = new InteractionService();

    // Get LLM selection from user
    const llmConfig = await promptForLLMSelection();
    logger.debug('LLM configuration:', JSON.stringify(llmConfig, null, 2));

    // Store the LLM configuration in the API service or config
    apiService.setLLMConfig(llmConfig);

    await withErrorHandling(
      async () => {
        let spinner: Ora | null = null;
        let specPath = options.spec;

        try {
          // Get OpenAPI spec path
          specPath = await getOpenAPISpecPath({ specPath, interactionService });

          // Start processing
          spinner = createProcessingSpinner('Processing OpenAPI specification...');

          // Load and validate the spec
          updateSpinnerText(spinner, 'Loading OpenAPI specification...');
          const spec = await loadAndValidateSpec({
            specPath,
            apiService,
          });

          // Display success message
          succeedSpinner(spinner, 'Specification loaded');

          // Process and display results
          const { endpoints } = displayRawResults({
            spec,
            apiService,
            interactionService,
          });

          // Extract and save to JSON
          updateSpinnerText(spinner, 'Extracting endpoint information...');
          const { outputPath, extractedInfo } = await extractAndSaveToJSON({
            endpoints,
            apiService,
            spinner,
          });

          // Phase 3 - Vector database integration
          updateSpinnerText(spinner, 'Starting ChromaDB server...');
          let collection = null;

          try {
            const dbStarted = await ensureChromaDBServer({
              host: 'localhost',
              port: 8000,
              path: './ariellejs-chroma-db-data',
              verbose: options.verbose,
            });

            if (!dbStarted) {
              throw new Error('Failed to start ChromaDB server');
            }

            updateSpinnerText(spinner, 'Uploading to vector database...');
            const uploadResult = await uploadToVectorDB(
              'openapi-spec-docs',
              extractedInfo,
              options.verbose
            );

            if (!uploadResult.success || !uploadResult.collection) {
              throw new Error(uploadResult.error || 'Failed to upload to vector database');
            }

            collection = uploadResult.collection;

            // Phase 4 - Start LLM query interface
            try {
              const selectedProvider = llmConfig.provider;
              const llmService = new LLMService({
                provider: selectedProvider,
                config: {
                  apiKey: process.env[`${selectedProvider.toUpperCase()}_API_KEY`] || '',
                  baseUrl: process.env[`${selectedProvider.toUpperCase()}_BASE_URL`],
                  model: process.env[`${selectedProvider.toUpperCase()}_MODEL`],
                  embeddingModel: options.embeddingModel || 'text-embedding-3-small',
                },
              });

              // Clear the spinner before starting the conversation
              spinner?.stop();

              // Start the interactive conversation
              await llmService.startConversation();

              // Re-create the spinner if we need to continue with other operations
              spinner = createProcessingSpinner('Finishing up...');
            } catch (error) {
              logger.error('Error in LLM service:', error);
              throw error;
            }
          } catch (error) {
            if (error instanceof Error) {
              logger.warn(`Skipping vector database operations: ${error.message}`);
            } else {
              logger.warn('Skipping vector database operations due to an error');
            }
            if (options.verbose) {
              console.error(error);
            }
          }

          succeedSpinner(spinner, `Extraction complete. Saved to ${outputPath}`);

          interactionService.displayCompletionMessage();
        } catch (error) {
          if (spinner) {
            spinner.fail('Failed to complete ArielleJS wizard');
          }
          throw error;
        } finally {
          if (spinner) {
            spinner.stop();
          }
        }
      },
      {
        showStack: options.verbose,
        logger,
      } as any
    );
  });

// Re-export for testing
export const _private = {
  Logger,
  APIService,
  InteractionService,
};
