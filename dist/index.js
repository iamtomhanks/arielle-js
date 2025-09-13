#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './cli/start.js';
const program = new Command();
program
    .name('arielle')
    .description('CLI for ArielleJS - Your OpenAPI companion')
    .version('0.1.0')
    .addCommand(startCommand);
async function main() {
    try {
        await program.parseAsync(process.argv);
    }
    catch (error) {
        console.error('An error occurred:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
main();
