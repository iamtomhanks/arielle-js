#!/usr/bin/env node

console.log('ArielleJS CLI starting...');
console.log('Node version:', process.version);
console.log('Arguments:', process.argv);

import { Command } from 'commander';
import { startCommand } from './cli/start.js';

const program = new Command();

program
  .name('arielle')
  .description('CLI for ArielleJS - Your OpenAPI companion')
  .version('0.1.0')
  .addCommand(startCommand);

// Enable better error handling
program.exitOverride((err) => {
  if (err.code === 'commander.unknownCommand') {
    console.error('Unknown command. Use --help to see available commands.');
  } else {
    console.error('An error occurred:', err.message);
  }
  process.exit(1);
});

async function main() {
  try {
    console.log('Starting command execution...');
    await program.parseAsync(process.argv);
    console.log('Command execution completed');
  } catch (error) {
    console.error('\nAn unhandled error occurred:');
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error in main:', error);
  process.exit(1);
});
