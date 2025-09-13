import { Command } from 'commander';
import ora from 'ora';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Logger, logger } from '../utils/logger.js';
import { withErrorHandling } from '../utils/error-handler.js';
import { loadOpenAPI } from '../openapi/loader.js';
import { validateFullOpenAPISpec } from '../openapi/validator.js';
import { processOpenAPISpec } from '../openapi/processor.js';
export const startCommand = new Command('start')
    .description('Start the ArielleJS wizard')
    .option('--verbose', 'Enable verbose logging', false)
    .option('-s, --spec <path>', 'Path or URL to OpenAPI specification (YAML/JSON)')
    .option('-o, --output <path>', 'Output directory for processed data')
    .action(async (options) => {
    console.log('CLI started with options:', JSON.stringify(options, null, 2));
    // Initialize logger with verbosity
    const logger = Logger.getInstance(options.verbose);
    await withErrorHandling(async () => {
        const spinner = ora('Initializing ArielleJS...').start();
        try {
            logger.debug('Starting ArielleJS in verbose mode');
            // Get OpenAPI spec path if not provided
            let specPath = options.spec;
            console.log('Spec path from options:', specPath);
            if (!specPath) {
                console.log('No spec path provided, prompting user...');
                try {
                    const answers = await inquirer.prompt([{
                            type: 'input',
                            name: 'specPath',
                            message: 'Enter the path or URL to your OpenAPI specification (YAML/JSON):',
                            validate: (input) => {
                                console.log('Validating input:', input);
                                return input.trim() ? true : 'Please enter a valid path or URL';
                            }
                        }]);
                    specPath = answers.specPath;
                    console.log('User provided spec path:', specPath);
                }
                catch (error) {
                    console.error('Error during inquirer prompt:', error);
                    throw error;
                }
            }
            // Load and validate the OpenAPI spec
            spinner.text = 'Loading OpenAPI specification...';
            if (!specPath) {
                const error = new Error('No OpenAPI specification path provided');
                console.error(error.message);
                throw error;
            }
            console.log('Loading spec from path:', specPath);
            let spec;
            try {
                spec = await loadOpenAPI(specPath);
                console.log('Successfully loaded spec. Title:', spec.info?.title);
            }
            catch (error) {
                console.error('Error loading spec:', error);
                throw error;
            }
            // Perform full validation
            spinner.text = 'Validating OpenAPI specification...';
            try {
                validateFullOpenAPISpec(spec);
                spinner.succeed('OpenAPI specification is valid');
            }
            catch (error) {
                spinner.warn('OpenAPI specification has validation warnings');
                logger.warn(error.message);
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
                if (sample.summary)
                    console.log(chalk.gray(sample.summary));
                if (sample.parameters.length > 0) {
                    console.log('\nParameters:');
                    sample.parameters.slice(0, 3).forEach((param) => {
                        console.log(`- ${param.name} (${param.in})`);
                    });
                    if (sample.parameters.length > 3) {
                        console.log(`- ...and ${sample.parameters.length - 3} more`);
                    }
                }
            }
            // TODO: Add vector database integration in Phase 3
            console.log('\n' + chalk.yellow('Note: Vector database integration will be added in Phase 3'));
        }
        catch (error) {
            spinner.fail('Failed to complete ArielleJS wizard');
            throw error;
        }
    }, {
        showStack: options.verbose,
        logger
    });
});
// Re-export for testing
export const _private = {
    Logger,
    logger
};
