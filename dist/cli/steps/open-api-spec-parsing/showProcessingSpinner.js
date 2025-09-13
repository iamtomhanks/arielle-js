import ora from 'ora';
import chalk from 'chalk';
export function createProcessingSpinner(text) {
    return ora({
        text: chalk.dim(text),
        color: 'cyan',
    }).start();
}
export function updateSpinnerText(spinner, text) {
    spinner.text = chalk.dim(text);
}
export function succeedSpinner(spinner, message) {
    spinner.succeed(chalk.green('✓ ') + message);
}
export function failSpinner(spinner, message) {
    spinner.fail(chalk.red('✗ ') + message);
}
export function stopSpinner(spinner) {
    spinner.stop();
}
