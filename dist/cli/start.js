import { Command } from 'commander';
import ora from 'ora';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { UI } from '../utils/ui.js';
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
    // Show beautiful banner
    UI.showBanner();
    if (options.verbose) {
        UI.info('Debug mode enabled');
        console.log('CLI started with options:', JSON.stringify(options, null, 2));
    }
    // Initialize logger with verbosity
    const logger = Logger.getInstance(options.verbose);
    // Show welcome message
    UI.section('Welcome to ArielleJS');
    UI.info('The OpenAPI companion for your API development workflow\n');
    await withErrorHandling(async () => {
        let spinner = ora('Initializing ArielleJS...').start();
        try {
            // Get OpenAPI spec path if not provided
            let specPath = options.spec;
            if (!specPath) {
                // No need to stop spinner here since we haven't started it yet
                UI.section('OpenAPI Specification');
                UI.info('Please provide the path or URL to your OpenAPI specification file (YAML/JSON)');
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'specPath',
                        message: 'Path/URL to OpenAPI spec:',
                        prefix: chalk.cyan('?'),
                        validate: (input) => {
                            return input.trim() ? true : 'Please enter a valid path or URL';
                        },
                    },
                ]);
                specPath = answers.specPath;
            }
            // Start spinner after we have the spec path
            spinner = ora({
                text: chalk.dim('Initializing ArielleJS...'),
                color: 'cyan',
            }).start();
            logger.debug('Starting ArielleJS in verbose mode');
            // Load and validate the OpenAPI spec
            if (spinner)
                spinner.text = chalk.dim('Loading OpenAPI specification...');
            if (!specPath) {
                const error = new Error('No OpenAPI specification path provided');
                if (spinner)
                    spinner.fail(chalk.red('Error: ') + error.message);
                throw error;
            }
            logger.debug('Loading spec from path:', specPath);
            let spec;
            try {
                spec = await loadOpenAPI(specPath);
                if (spinner)
                    spinner.succeed(chalk.green('✓ ') + 'Specification loaded');
                UI.section('API Information');
                UI.table([
                    ['Title', spec.info?.title || 'N/A'],
                    ['Version', spec.info?.version || 'N/A'],
                    [
                        'Description',
                        spec.info?.description?.split('\n')[0] +
                            (spec.info?.description?.includes('\n') ? '...' : '') || 'N/A',
                    ],
                    ['Endpoints', Object.keys(spec.paths || {}).length.toString()],
                ]);
            }
            catch (error) {
                if (spinner)
                    spinner.fail(chalk.red('Error loading specification'));
                UI.error(`Failed to load OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            // Process the spec
            if (spinner)
                spinner.text = chalk.dim('Processing API endpoints...');
            const endpoints = processOpenAPISpec(spec);
            if (spinner)
                spinner.succeed(chalk.green('✓ ') + `Processed ${endpoints.length} endpoints`);
            UI.section('API Endpoints');
            // Group endpoints by tag
            const endpointsByTag = {};
            endpoints.forEach((endpoint) => {
                const tag = endpoint.tags?.[0] || 'Other';
                if (!endpointsByTag[tag]) {
                    endpointsByTag[tag] = [];
                }
                endpointsByTag[tag].push(endpoint);
            });
            // Display endpoints by tag
            for (const [tag, tagEndpoints] of Object.entries(endpointsByTag)) {
                console.log(`\n${chalk.cyan.bold(tag)} (${tagEndpoints.length} endpoints)`);
                tagEndpoints.slice(0, 5).forEach((endpoint) => {
                    const method = endpoint.method.toLowerCase();
                    let coloredMethod;
                    // Handle different HTTP methods with appropriate colors
                    switch (method) {
                        case 'get':
                            coloredMethod = chalk.green.bold(endpoint.method.padEnd(6));
                            break;
                        case 'post':
                            coloredMethod = chalk.blue.bold(endpoint.method.padEnd(6));
                            break;
                        case 'put':
                            coloredMethod = chalk.yellow.bold(endpoint.method.padEnd(6));
                            break;
                        case 'delete':
                            coloredMethod = chalk.red.bold(endpoint.method.padEnd(6));
                            break;
                        case 'patch':
                            coloredMethod = chalk.magenta.bold(endpoint.method.padEnd(6));
                            break;
                        default:
                            coloredMethod = chalk.white.bold(endpoint.method.padEnd(6));
                    }
                    console.log(`  ${coloredMethod} ${endpoint.path}`);
                    if (endpoint.summary) {
                        console.log(`    ${chalk.dim(endpoint.summary)}`);
                    }
                });
                if (tagEndpoints.length > 5) {
                    console.log(chalk.dim(`  ...and ${tagEndpoints.length - 5} more endpoints`));
                }
            }
            UI.divider();
            // Show next steps
            UI.section('Next Steps');
            console.log(chalk.green('✓ ') + 'Your API has been successfully analyzed');
            console.log(chalk.yellow('! ') + 'Vector database integration coming in Phase 3');
            console.log('\n' + chalk.dim('Run with --verbose for detailed logging'));
        }
        catch (error) {
            if (spinner) {
                spinner.fail('Failed to complete ArielleJS wizard');
            }
            throw error;
        }
        finally {
            if (spinner) {
                spinner.stop();
            }
        }
    }, {
        showStack: options.verbose,
        logger,
    });
});
// Re-export for testing
export const _private = {
    Logger,
    logger,
};
