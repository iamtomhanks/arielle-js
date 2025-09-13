import chalk from 'chalk';
import { ChromaClient, Metadata } from 'chromadb';
import { ExtractedEndpointInfoEmbeddingFormat } from '../../../modules/api/extraction-service.js';

const client = new ChromaClient(); // This will use the default persistent client

export async function uploadToVectorDB(
  collectionName: string,
  documents: ExtractedEndpointInfoEmbeddingFormat[]
) {
  // Create a parallel array for each required field
  const ids = documents.map((d) => d.id);
  const docs = documents.map((d) => d.content);
  const metadatas: Metadata[] = documents.map(({ id, method, path, tags, deprecated }) => ({
    id,
    method,
    path,
    tags: tags?.join(',') || '',
    deprecated: deprecated || false,
  }));

  try {
    const collection = await client.getOrCreateCollection({ name: collectionName });

    // The add method takes parallel arrays for documents, metadatas, and ids.
    await collection.add({
      ids: ids,
      documents: docs,
      metadatas,
    });

    chalk.green(`Successfully added ${documents.length} documents to collection.`);
  } catch (error) {
    chalk.red('Error adding documents to ChromaDB:', error);
  }
}
