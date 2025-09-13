import { ChromaClient, type Collection } from 'chromadb';
import { logger } from '../utils/logger.js';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

/**
 * Gets or creates a ChromaDB client instance
 */
export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    const serverUrl = process.env.CHROMA_SERVER_URL || 'http://localhost:8000';
    logger.debug(`Initializing ChromaDB client with URL: ${serverUrl}`);
    
    client = new ChromaClient({
      path: serverUrl
    });

    try {
      await client.heartbeat();
      logger.info('Successfully connected to ChromaDB server');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to connect to ChromaDB server at ${serverUrl}: ${errorMessage}`);
      throw new Error(`Could not connect to ChromaDB: ${errorMessage}`);
    }
  }
  return client;
}

/**
 * Gets or creates the OpenAPI endpoints collection
 */
export async function getCollection(): Promise<Collection> {
  if (!collection) {
    const client = await getChromaClient();
    const collectionName = process.env.CHROMA_COLLECTION_NAME || 'openapi_endpoints';
    
    try {
      logger.debug(`Getting or creating collection: ${collectionName}`);
      collection = await client.getOrCreateCollection({
        name: collectionName,
        metadata: { 
          "hnsw:space": "cosine",
          "description": "OpenAPI endpoints with semantic search capabilities"
        }
      });
      
      logger.info(`Using ChromaDB collection: ${collectionName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to get or create collection ${collectionName}: ${errorMessage}`);
      throw new Error(`Failed to initialize collection: ${errorMessage}`);
    }
  }
  return collection;
}

/**
 * Resets the client and collection instances
 * Useful for testing or reconnection scenarios
 */
export function resetClient(): void {
  client = null;
  collection = null;
}
