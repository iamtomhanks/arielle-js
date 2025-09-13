import { getCollection } from './chroma-client.js';
import { logger } from '../utils/logger.js';
import ora from 'ora';
const BATCH_SIZE = 10; // Process endpoints in batches to avoid overwhelming the server
/**
 * Indexes a single API endpoint in ChromaDB
 */
export async function indexEndpoint(endpoint) {
    const collection = await getCollection();
    const endpointId = `${endpoint.path}:${endpoint.method}`.toLowerCase();
    try {
        const metadata = {
            path: endpoint.path,
            method: endpoint.method,
            ...(endpoint.operationId && { operation_id: endpoint.operationId }),
            ...(endpoint.tags && { tags: endpoint.tags.join(',') }),
            ...endpoint.metadata
        };
        await collection.upsert({
            ids: [endpointId],
            metadatas: [metadata],
            documents: [endpoint.nlpText]
        });
        logger.debug(`Indexed endpoint: ${endpointId}`);
    }
    catch (error) {
        logger.error(`Failed to index endpoint ${endpointId}:`, error);
        throw error;
    }
}
/**
 * Indexes multiple API endpoints with progress feedback
 */
export async function indexEndpoints(endpoints, onProgress) {
    if (endpoints.length === 0) {
        logger.warn('No endpoints provided for indexing');
        return;
    }
    const spinner = ora(`Indexing ${endpoints.length} endpoints...`).start();
    try {
        // Process in batches
        for (let i = 0; i < endpoints.length; i += BATCH_SIZE) {
            const batch = endpoints.slice(i, i + BATCH_SIZE);
            // Process batch in parallel
            await Promise.all(batch.map(endpoint => indexEndpoint(endpoint).catch(error => {
                logger.error(`Error indexing endpoint ${endpoint.path}:`, error);
                // Continue with other endpoints even if one fails
            })));
            // Update progress
            const processed = Math.min(i + BATCH_SIZE, endpoints.length);
            const progress = Math.round((processed / endpoints.length) * 100);
            spinner.text = `Indexing... ${processed}/${endpoints.length} (${progress}%)`;
            if (onProgress) {
                onProgress(processed, endpoints.length);
            }
        }
        spinner.succeed(`Successfully indexed ${endpoints.length} endpoints`);
    }
    catch (error) {
        spinner.fail('Failed to index endpoints');
        logger.error('Batch indexing failed:', error);
        throw error;
    }
}
/**
 * Clears all documents from the collection
 */
export async function clearCollection() {
    const spinner = ora('Clearing vector database...').start();
    try {
        const collection = await getCollection();
        await collection.delete({});
        spinner.succeed('Vector database cleared');
        logger.info('Cleared all documents from the collection');
    }
    catch (error) {
        spinner.fail('Failed to clear vector database');
        logger.error('Error clearing collection:', error);
        throw error;
    }
}
/**
 * Gets the current number of documents in the collection
 */
export async function getDocumentCount() {
    try {
        const collection = await getCollection();
        const count = await collection.count();
        logger.debug(`Current document count: ${count}`);
        return count;
    }
    catch (error) {
        logger.error('Failed to get document count:', error);
        return 0;
    }
}
