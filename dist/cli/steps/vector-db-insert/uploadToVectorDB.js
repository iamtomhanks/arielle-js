import chalk from 'chalk';
import { ChromaClient } from 'chromadb';
import { Logger } from '../../../utils/logger.js';
// Simple configuration for local ChromaDB
const client = new ChromaClient({
    path: 'http://localhost:8000'
});
export async function uploadToVectorDB(collectionName, documents, verbose = false) {
    const logger = Logger.getInstance(verbose);
    try {
        // Check server connectivity
        logger.info(chalk.blue('Testing ChromaDB connection...'));
        try {
            const heartbeat = await client.heartbeat();
            logger.info(chalk.green(`✓ ChromaDB Heartbeat response: ${JSON.stringify(heartbeat)}`));
        }
        catch (heartbeatError) {
            logger.error(chalk.red('✗ Could not connect to ChromaDB. Please make sure the server is running.'));
            if (heartbeatError instanceof Error) {
                logger.error(chalk.red(`Error details: ${heartbeatError.message}`));
            }
            throw new Error('ChromaDB connection failed');
        }
        // List existing collections for debugging
        try {
            const collections = await client.listCollections();
            logger.info(chalk.blue(`Existing collections: ${collections.map(c => c.name).join(', ') || 'None'}`));
        }
        catch (listError) {
            const errorMessage = listError instanceof Error ? listError.message : 'Unknown error';
            logger.warn(chalk.yellow(`Could not list collections: ${errorMessage}`));
        }
        // Reset the database (be careful with this in production!)
        try {
            await client.reset();
            logger.info(chalk.blue('✓ Reset ChromaDB database'));
        }
        catch (resetError) {
            const errorMessage = resetError instanceof Error ? resetError.message : 'Unknown error';
            logger.warn(chalk.yellow(`Could not reset database: ${errorMessage}`));
            // Continue even if reset fails
        }
        // Create or get collection
        let collection;
        try {
            collection = await client.getOrCreateCollection({
                name: collectionName,
                metadata: { "hnsw:space": "cosine" }
            });
            logger.info(chalk.blue(`✓ Using collection: ${collectionName}`));
        }
        catch (collectionError) {
            const errorMessage = collectionError instanceof Error ? collectionError.message : 'Unknown error';
            logger.error(chalk.red(`Failed to create/get collection ${collectionName}: ${errorMessage}`));
            if (verbose && collectionError instanceof Error && collectionError.stack) {
                logger.debug(chalk.gray(collectionError.stack));
            }
            throw new Error(`Collection operation failed: ${errorMessage}`);
        }
        // Prepare documents for insertion
        try {
            logger.info(chalk.blue(`Preparing ${documents.length} documents for upload...`));
            const batchSize = 100; // Process in batches to avoid overwhelming the server
            const totalBatches = Math.ceil(documents.length / batchSize);
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                logger.info(chalk.blue(`Processing batch ${batchNumber} of ${totalBatches} (documents ${i + 1} to ${Math.min(i + batchSize, documents.length)})`));
                const ids = batch.map((doc, idx) => doc.id || `doc_${i + idx}`);
                const embeddings = batch.map(() => new Array(1536).fill(0)); // Dummy embeddings for now
                const metadatas = batch.map(doc => ({
                    method: doc.method,
                    path: doc.path,
                    summary: doc.summary?.substring(0, 200) || '', // Limit summary length
                    tags: doc.tags?.join(',')?.substring(0, 200) || '',
                    operationId: doc.operationId || ''
                }));
                const docs = batch.map(doc => doc.content);
                logger.debug(chalk.blue(`Adding batch ${batchNumber} with ${batch.length} documents`));
                await collection.add({
                    ids,
                    embeddings,
                    metadatas,
                    documents: docs
                });
                logger.info(chalk.green(`✓ Added batch ${batchNumber}/${totalBatches} (${i + batch.length}/${documents.length} documents)`));
            }
            // Verify the count
            const count = await collection.count();
            logger.info(chalk.green(`✅ Successfully uploaded ${count} documents to collection '${collectionName}'`));
            return {
                success: true,
                collection: collection
            };
        }
        catch (uploadError) {
            const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
            logger.error(chalk.red('❌ Failed to upload documents to ChromaDB:'));
            logger.error(chalk.red(`- ${errorMessage}`));
            if (verbose && uploadError instanceof Error && uploadError.stack) {
                logger.debug(chalk.gray(uploadError.stack));
            }
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(chalk.red('❌ Error with ChromaDB:'));
        logger.error(chalk.red(`- ${errorMessage}`));
        if (verbose && error instanceof Error && error.stack) {
            logger.debug(chalk.gray(error.stack));
        }
        else if (verbose) {
            logger.debug(chalk.gray(String(error)));
        }
        return {
            success: false,
            error: errorMessage
        };
    }
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
