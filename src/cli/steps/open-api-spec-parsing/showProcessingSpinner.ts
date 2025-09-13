import ora, { type Ora } from 'ora';
import chalk from 'chalk';

export function createProcessingSpinner(text: string): Ora {
  return ora({
    text: chalk.dim(text),
    color: 'cyan',
  }).start();
}

export function updateSpinnerText(spinner: Ora, text: string): void {
  spinner.text = chalk.dim(text);
}

export function succeedSpinner(spinner: Ora, message: string): void {
  spinner.succeed(chalk.green('✓ ') + message);
}

export function failSpinner(spinner: Ora, message: string): void {
  spinner.fail(chalk.red('✗ ') + message);
}

export function stopSpinner(spinner: Ora): void {
  spinner.stop();
}
