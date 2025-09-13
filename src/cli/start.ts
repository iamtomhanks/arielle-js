import { Command } from 'commander';
import ora, { type Ora } from 'ora';
import chalk from 'chalk';
import path from 'path';
import { UI } from '../utils/ui.js';
import { Logger } from '../utils/logger.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { APIService } from '../modules/api/api-service.js';
import { InteractionService } from '../modules/cli/interaction-service.js';
import { saveToJsonFile, generateTimestampFilename } from '../utils/file-utils.js';
import type { OpenAPIV3 } from 'openapi-types';

interface StartOptions {
  verbose: boolean;
  spec?: string;
  output?: string;
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
          // Get OpenAPI spec path if not provided
          if (!specPath) {
            specPath = await interactionService.promptForSpecPath();
          }

          // Start processing
          spinner = ora({
            text: chalk.dim('Processing OpenAPI specification...'),
            color: 'cyan',
          }).start();

          // Load and validate the spec
          spinner.text = chalk.dim('Loading OpenAPI specification...');
          const spec = await apiService.loadAndValidateSpec(specPath!);
          
          // Display API information
          spinner.succeed(chalk.green('✓ ') + 'Specification loaded');
          const apiInfo = apiService.getAPIInfo(spec);
          interactionService.displayAPIInfo(apiInfo);

          // Process endpoints
          spinner = ora(chalk.dim('Processing API endpoints...')).start();
          const endpoints = apiService.processEndpoints(spec);
          const endpointsByTag = apiService.groupEndpointsByTag(endpoints);
          spinner.succeed(chalk.green('✓ ') + `Processed ${endpoints.length} endpoints`);

          // Display results
          interactionService.displayEndpoints(endpointsByTag);
          
          // Extract and save endpoint information
          spinner = ora(chalk.dim('Extracting endpoint information...')).start();
          const extractedInfo = apiService.extractEndpointInfo(endpoints);
          
          // Save to JSON file
          const outputDir = path.resolve(process.cwd(), 'phase2-output');
          const filename = generateTimestampFilename('api-extraction');
          const outputPath = await saveToJsonFile(filename, extractedInfo, {
            outputDir,
            createDir: true,
            pretty: true
          });
          
          spinner.succeed(chalk.green('✓ ') + `Extraction complete. Saved to ${outputPath}`);
          
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
