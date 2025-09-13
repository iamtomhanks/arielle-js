import { ChromaClient, type Collection } from 'chromadb';
/**
 * Gets or creates a ChromaDB client instance
 */
export declare function getChromaClient(): Promise<ChromaClient>;
/**
 * Gets or creates the OpenAPI endpoints collection
 */
export declare function getCollection(): Promise<Collection>;
/**
 * Resets the client and collection instances
 * Useful for testing or reconnection scenarios
 */
export declare function resetClient(): void;
