import { logger } from './logger.js';

export class ArielleError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'ArielleError';
    this.code = code;
    this.details = details;
    
    // This is needed to restore the correct prototype chain
    Object.setPrototypeOf(this, ArielleError.prototype);
  }
}

export function handleError(error: unknown, context = 'An error occurred'): never {
  if (error instanceof ArielleError) {
    logger.error(`${context}: ${error.message} (code: ${error.code})`, error.details);
  } else if (error instanceof Error) {
    logger.error(`${context}: ${error.message}`, error);
  } else {
    logger.error(`${context}: ${String(error)}`);
  }
  
  process.exit(1);
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context = 'An error occurred'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
  }
}
