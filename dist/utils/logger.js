import chalk from 'chalk';
export { chalk };
export class Logger {
    constructor(verbose = false) {
        this.isVerbose = verbose;
    }
    static getInstance(verbose = false) {
        if (!Logger.instance) {
            Logger.instance = new Logger(verbose);
        }
        return Logger.instance;
    }
    info(message) {
        console.log(chalk.blue(`[INFO] ${message}`));
    }
    success(message) {
        console.log(chalk.green(`[SUCCESS] ${message}`));
    }
    warn(message) {
        console.warn(chalk.yellow(`[WARN] ${message}`));
    }
    error(message, error) {
        console.error(chalk.red(`[ERROR] ${message}`));
        if (error instanceof Error && this.isVerbose) {
            console.error(chalk.red(error.stack));
        }
        else if (error && this.isVerbose) {
            console.error(chalk.red(JSON.stringify(error, null, 2)));
        }
    }
    debug(message, data) {
        if (this.isVerbose) {
            console.log(chalk.gray(`[DEBUG] ${message}`));
            if (data) {
                console.log(chalk.gray(JSON.stringify(data, null, 2)));
            }
        }
    }
}
export const logger = Logger.getInstance();
