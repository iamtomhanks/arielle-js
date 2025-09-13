export interface VectorSearchResult {
  id: string;
  path: string;
  method: string;
  score: number;
  operationId?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface IndexedEndpoint {
  id: string;
  path: string;
  method: string;
  operationId?: string;
  tags?: string[];
  nlpText: string;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  includeMetadata?: boolean;
}
