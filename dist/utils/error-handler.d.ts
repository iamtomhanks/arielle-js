export declare class ArielleError extends Error {
    readonly code: string;
    readonly details?: unknown;
    constructor(message: string, code: string, details?: unknown);
}
export declare function handleError(error: unknown, context?: string): never;
export declare function withErrorHandling<T>(fn: () => Promise<T>, context?: string): Promise<T>;
