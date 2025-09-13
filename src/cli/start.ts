import { Command } from 'commander';
import ora, { type Ora } from 'ora';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Logger, logger } from '../utils/logger.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { loadOpenAPI } from '../openapi/loader.js';
import { validateFullOpenAPISpec } from '../openapi/validator.js';
import { processOpenAPISpec } from '../openapi/processor.js';
import type { ParameterObject } from '../openapi/types.js';

interface StartOptions {
  verbose: boolean;
  spec?: string;
  output?: string;
}

export const startCommand = new Command('start')
  .description('Start the ArielleJS wizard')
  .option('--verbose', 'Enable verbose logging', false)
  .option('-s, --spec <path>', 'Path or URL to OpenAPI specification (YAML/JSON)')
  .option('-o, --output <path>', 'Output directory for processed data')
  .action(async (options: StartOptions) => {
    console.log('CLI started with options:', JSON.stringify(options, null, 2));
    // Initialize logger with verbosity
    const logger = Logger.getInstance(options.verbose);
    
    await withErrorHandling(async () => {
      // Don't start spinner yet as it will interfere with inquirer
      let spinner: Ora | null = null;
      
      try {
        // Get OpenAPI spec path if not provided
        let specPath = options.spec;
        
        if (!specPath) {
          // No need to stop spinner here since we haven't started it yet
          
          const answers = await inquirer.prompt([{
            type: 'input',
            name: 'specPath',
            message: 'Enter the path or URL to your OpenAPI specification (YAML/JSON):',
            validate: (input: string) => {
              return input.trim() ? true : 'Please enter a valid path or URL';
            }
          }]);
          specPath = answers.specPath;
        }
        
        // Start spinner after we have the spec path
        spinner = ora('Initializing ArielleJS...').start();
        logger.debug('Starting ArielleJS in verbose mode');
        
        // Load and validate the OpenAPI spec
        spinner.text = 'Loading OpenAPI specification...';
        if (!specPath) {
          const error = new Error('No OpenAPI specification path provided');
          if (spinner) spinner.fail(error.message);
          throw error;
        }
        
        console.log('Loading spec from path:', specPath);
        let spec;
        try {
          spec = await loadOpenAPI(specPath);
          console.log('Successfully loaded spec. Title:', spec.info?.title);
        } catch (error) {
          console.error('Error loading spec:', error);
          throw error;
        }
        
        // Perform full validation
        spinner.text = 'Validating OpenAPI specification...';
        try {
          validateFullOpenAPISpec(spec);
          spinner.succeed('OpenAPI specification is valid');
        } catch (error) {
          spinner.warn('OpenAPI specification has validation warnings');
          logger.warn((error as Error).message);
        }
        
        // Process the OpenAPI spec
        spinner.start('Processing API endpoints...');
        const endpoints = processOpenAPISpec(spec);
        
        // Display summary
        spinner.succeed(`Successfully processed ${chalk.bold(endpoints.length)} API endpoints`);
        
        // Display a sample of the processed data
        if (endpoints.length > 0) {
          console.log('\n' + chalk.underline('Sample Endpoint:'));
          const sample = endpoints[0];
          console.log(chalk.bold(`${sample.method} ${sample.path}`));
          if (sample.summary) console.log(chalk.gray(sample.summary));
          if (sample.parameters.length > 0) {
            console.log('\nParameters:');
            sample.parameters.slice(0, 3).forEach((param: ParameterObject) => {
              console.log(`- ${param.name} (${param.in})`);
            });
            if (sample.parameters.length > 3) {
              console.log(`- ...and ${sample.parameters.length - 3} more`);
            }
          }
        }
        
        // TODO: Add vector database integration in Phase 3
        console.log('\n' + chalk.yellow('Note: Vector database integration will be added in Phase 3'));
        
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
    }, {
      showStack: options.verbose,
      logger
    } as any);
  });

// Re-export for testing
export const _private = {
  Logger,
  logger
};
