import chalk from 'chalk';
import { ChromaClient } from 'chromadb';
import { ExtractedEndpointInfoEmbeddingFormat } from '../../../modules/api/extraction-service.js';
import { Logger } from '../../../utils/logger.js';

const client = new ChromaClient({
  ssl: false,
  host: 'localhost',
  port: 8000,
  database: 'ariellejs-chroma-db-data',
  headers: {},
});

export async function uploadToVectorDB(
  collectionName: string,
  documents: ExtractedEndpointInfoEmbeddingFormat[],
  verbose = false
) {
  const heartbeat = await client.heartbeat();
  await client.reset();

  const logger = Logger.getInstance(verbose);
  logger.info(chalk.blue(`ChromaDB Heartbeat: ${JSON.stringify(heartbeat)}`));
  logger.info(chalk.blue('Uploading documents to ChromaDB...'));

  return true;
  // // Create a parallel array for each required field
  // const ids = documents.map((d) => d.id);
  // const docs = documents.map((d) => d.content);
  // const metadatas: Metadata[] = documents.map(({ id, method, path, tags, deprecated }) => ({
  //   id,
  //   method,
  //   path,
  //   tags: tags?.join(',') || '',
  //   deprecated: deprecated || false,
  // }));

  // try {
  //   logger.debug('Connecting to ChromaDB...');
  //   const collection = await client.getOrCreateCollection({
  //     name: collectionName,
  //     metadata: { 'hnsw:space': 'cosine' }, // Add metadata for better search
  //   });

  //   logger.debug(
  //     `Collection '${collectionName}' ready, preparing to add ${documents.length} documents...`
  //   );

  //   // The add method takes parallel arrays for documents, metadatas, and ids.
  //   const result = await collection.add({
  //     ids: ids,
  //     documents: docs,
  //     metadatas,
  //   });

  //   logger.debug('Add operation completed:', result);
  //   logger.info(
  //     chalk.green(
  //       `✅ Successfully added ${documents.length} documents to collection '${collectionName}'.`
  //     )
  //   );
  //   return true;
  // } catch (error) {
  //   logger.error('❌ Error adding documents to ChromaDB:');
  //   if (error instanceof Error) {
  //     logger.error(`- Message: ${error.message}`);
  //     logger.error(`- Stack: ${error.stack || 'No stack trace available'}`);
  //   } else {
  //     logger.error('- ', error);
  //   }

  //   // Log additional debug info
  //   logger.debug('Document count:', documents.length);
  //   if (documents.length > 0) {
  //     logger.debug('First document sample:', JSON.stringify(documents[0], null, 2));
  //   }

  //   return false;
  // }
}
