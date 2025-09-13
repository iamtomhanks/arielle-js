import { logger } from './logger.js';
export class ArielleError extends Error {
    constructor(message, code, details) {
        super(message);
        this.name = 'ArielleError';
        this.code = code;
        this.details = details;
        // This is needed to restore the correct prototype chain
        Object.setPrototypeOf(this, ArielleError.prototype);
    }
}
export function handleError(error, context = 'An error occurred') {
    if (error instanceof ArielleError) {
        logger.error(`${context}: ${error.message} (code: ${error.code})`, error.details);
    }
    else if (error instanceof Error) {
        logger.error(`${context}: ${error.message}`, error);
    }
    else {
        logger.error(`${context}: ${String(error)}`);
    }
    process.exit(1);
}
export async function withErrorHandling(fn, context = 'An error occurred') {
    try {
        return await fn();
    }
    catch (error) {
        handleError(error, context);
    }
}
