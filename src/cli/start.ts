import { Command } from 'commander';
import { type Ora } from 'ora';
import { APIService } from '../modules/api/api-service.js';
import { InteractionService } from '../modules/cli/interaction-service.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';
import { UI } from '../utils/ui.js';
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
            const uploadSuccess = await uploadToVectorDB(
              'openapi-spec-docs',
              extractedInfo,
              options.verbose
            );

            if (!uploadSuccess) {
              logger.warn('Vector database upload had issues, but continuing with file export...');
            }
          } catch (error) {
            if (error instanceof Error) {
              logger.warn(`Skipping vector database upload: ${error.message}`);
            } else {
              logger.warn('Skipping vector database upload due to an error');
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
