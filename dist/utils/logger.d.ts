import chalk from 'chalk';
export { chalk };
export declare class Logger {
    private static instance;
    private isVerbose;
    private constructor();
    static getInstance(verbose?: boolean): Logger;
    info(message: string): void;
    success(message: string): void;
    warn(message: string): void;
    error(message: string, error?: unknown): void;
    debug(message: string, data?: unknown): void;
}
export declare const logger: Logger;
