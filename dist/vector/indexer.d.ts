import type { IndexedEndpoint } from '../types/vector.js';
/**
 * Indexes a single API endpoint in ChromaDB
 */
export declare function indexEndpoint(endpoint: IndexedEndpoint): Promise<void>;
/**
 * Indexes multiple API endpoints with progress feedback
 */
export declare function indexEndpoints(endpoints: IndexedEndpoint[], onProgress?: (progress: number, total: number) => void): Promise<void>;
/**
 * Clears all documents from the collection
 */
export declare function clearCollection(): Promise<void>;
/**
 * Gets the current number of documents in the collection
 */
export declare function getDocumentCount(): Promise<number>;
