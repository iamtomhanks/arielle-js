// Core functionality
export { getChromaClient, getCollection, resetClient } from './chroma-client.js';
export { indexEndpoint, indexEndpoints, clearCollection, getDocumentCount } from './indexer.js';
export { semanticSearch, findSimilarEndpoints } from './searcher.js';

// Types
export type { 
  VectorSearchResult, 
  IndexedEndpoint, 
  SearchOptions 
} from '../types/vector.js';
