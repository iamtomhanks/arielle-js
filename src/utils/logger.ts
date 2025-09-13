import chalk from 'chalk';

export { chalk };

export class Logger {
  private static instance: Logger;
  private isVerbose: boolean;

  private constructor(verbose = false) {
    this.isVerbose = verbose;
  }

  public static getInstance(verbose = false): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(verbose);
    }
    return Logger.instance;
  }

  public info(message: string): void {
    console.log(chalk.blue(`[INFO] ${message}`));
  }

  public success(message: string): void {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }

  public warn(message: string): void {
    console.warn(chalk.yellow(`[WARN] ${message}`));
  }

  public error(message: string, error?: unknown): void {
    console.error(chalk.red(`[ERROR] ${message}`));
    if (error instanceof Error && this.isVerbose) {
      console.error(chalk.red(error.stack));
    } else if (error && this.isVerbose) {
      console.error(chalk.red(JSON.stringify(error, null, 2)));
    }
  }

  public debug(message: string, data?: unknown): void {
    if (this.isVerbose) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }
}

export const logger = Logger.getInstance();
