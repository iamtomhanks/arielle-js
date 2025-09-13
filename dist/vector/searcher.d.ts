import type { VectorSearchResult, SearchOptions } from '../types/vector.js';
export declare function semanticSearch(query: string, options?: SearchOptions): Promise<VectorSearchResult[]>;
/**
 * Finds similar endpoints to the given endpoint
 */
export declare function findSimilarEndpoints(endpoint: {
    path: string;
    method: string;
}, options?: Omit<SearchOptions, 'includeMetadata'>): Promise<VectorSearchResult[]>;
