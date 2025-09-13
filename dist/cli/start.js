import { Command } from 'commander';
import ora from 'ora';
import { Logger, logger } from '../utils/logger.js';
import { withErrorHandling } from '../utils/error-handler.js';
export const startCommand = new Command('start')
    .description('Start the ArielleJS wizard')
    .option('--verbose', 'Enable verbose logging', false)
    .action(async (options) => {
    // Initialize logger with verbosity
    const logger = Logger.getInstance(options.verbose);
    await withErrorHandling(async () => {
        const spinner = ora('Initializing ArielleJS...').start();
        try {
            logger.debug('Starting ArielleJS in verbose mode');
            // TODO: Implement wizard logic
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
            spinner.succeed('ArielleJS is ready!');
            logger.success('Successfully initialized ArielleJS');
        }
        catch (error) {
            spinner.fail('Failed to start ArielleJS');
            throw error; // This will be caught by withErrorHandling
        }
    }, 'Failed to start ArielleJS');
});
// Re-export for testing
export const _private = {
    Logger,
    logger
};
