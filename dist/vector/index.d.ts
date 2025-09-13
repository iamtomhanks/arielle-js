export { getChromaClient, getCollection, resetClient } from './chroma-client.js';
export { indexEndpoint, indexEndpoints, clearCollection, getDocumentCount } from './indexer.js';
export { semanticSearch, findSimilarEndpoints } from './searcher.js';
export type { VectorSearchResult, IndexedEndpoint, SearchOptions } from '../types/vector.js';
