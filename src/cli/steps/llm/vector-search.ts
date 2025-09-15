import { Collection } from 'chromadb';
import { Logger } from '../../../utils/logger.js';

const logger = Logger.getInstance(!!process.env.DEBUG);

/**
 * Search for similar documents using vector similarity
 * @param collection ChromaDB collection to search in
 * @param query The search query
 * @param generateEmbeddings Function to generate embeddings for the query
 * @param options Search options
 * @returns Search results
 */
export async function vectorSearch({
  collection,
  query,
  generateEmbeddings,
  maxResults = 5,
  include = ['documents', 'metadatas', 'distances']
}: {
  collection: Collection;
  query: string;
  generateEmbeddings: (text: string) => Promise<number[]>;
  maxResults?: number;
  include?: string[];
}) {
  try {
    logger.info(`🔍 Starting vector search for query: ${query.substring(0, 100)}...`);
    
    // Generate embeddings for the query
    logger.debug('Generating query embeddings...');
    const queryEmbedding = await generateEmbeddings(query);
    
    if (!queryEmbedding || !queryEmbedding.length) {
      throw new Error('Failed to generate embeddings for the query');
    }
    
    logger.info(`✅ Generated query embedding with ${queryEmbedding.length} dimensions`);

    // Execute the search
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: maxResults,
      include,
    });
    
    return results;
  } catch (error) {
    logger.error('Error in vector search:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }
}

/**
 * Batch process multiple search queries
 * @param collection ChromaDB collection to search in
 * @param queries Array of search queries
 * @param generateEmbeddings Function to generate embeddings for the queries
 * @param options Search options
 * @returns Array of search results for each query
 */
export async function batchVectorSearch({
  collection,
  queries,
  generateEmbeddings,
  maxResults = 5,
  include = ['documents', 'metadatas', 'distances'],
  batchSize = 5
}: {
  collection: Collection;
  queries: string[];
  generateEmbeddings: (text: string) => Promise<number[]>;
  maxResults?: number;
  include?: string[];
  batchSize?: number;
}) {
  const results = [];
  
  // Process queries in batches to avoid overwhelming the system
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    logger.info(`🔍 Processing batch ${i / batchSize + 1} of ${Math.ceil(queries.length / batchSize)}...`);
    
    // Process current batch in parallel
    const batchPromises = batch.map(async (query, idx) => {
      try {
        logger.debug(`  • Processing query ${i + idx + 1}/${queries.length}: ${query.substring(0, 50)}...`);
        const result = await vectorSearch({
          collection,
          query,
          generateEmbeddings,
          maxResults,
          include,
        });
        return { success: true, query, result };
      } catch (error) {
        logger.error(`  ❌ Error processing query: ${query}`, error);
        return { success: false, query, error };
      }
    });
    
    // Wait for all queries in the current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}
