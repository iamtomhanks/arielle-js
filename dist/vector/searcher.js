import { getCollection } from './chroma-client.js';
import { logger } from '../utils/logger.js';
const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_SCORE = 0.4; // Minimum similarity score (0-1)
export async function semanticSearch(query, options = {}) {
    const { limit = DEFAULT_LIMIT, minScore = DEFAULT_MIN_SCORE, includeMetadata = false } = options;
    const collection = await getCollection();
    try {
        logger.debug(`Searching for: "${query}"`);
        const results = await collection.query({
            nResults: limit,
            queryTexts: [query],
            include: ['metadatas', 'distances']
        });
        if (!results.ids?.[0]?.length) {
            logger.debug('No results found');
            return [];
        }
        // Process and filter results
        const searchResults = [];
        for (let i = 0; i < results.ids[0].length; i++) {
            const id = results.ids[0][i];
            // Safely extract metadata with proper typing
            const rawMetadata = results.metadatas?.[0]?.[i];
            const metadata = {};
            if (rawMetadata) {
                if (typeof rawMetadata === 'object' && rawMetadata !== null) {
                    Object.assign(metadata, rawMetadata);
                }
            }
            const distance = results.distances?.[0]?.[i] || 1;
            // Convert distance to similarity score (1 - distance)
            const score = 1 - distance;
            // Skip results below minimum score threshold
            if (score < minScore) {
                logger.debug(`Skipping result with low score: ${score.toFixed(2)}`);
                continue;
            }
            searchResults.push({
                id,
                path: String(metadata.path || ''),
                method: String(metadata.method || ''),
                score: parseFloat(score.toFixed(4)),
                operationId: typeof metadata.operation_id === 'string' ? metadata.operation_id : undefined,
                tags: metadata.tags ? String(metadata.tags).split(',').filter(Boolean) : undefined,
                ...(includeMetadata ? { metadata } : {})
            });
        }
        logger.debug(`Found ${searchResults.length} relevant results`);
        return searchResults;
    }
    catch (error) {
        logger.error('Semantic search failed:', error);
        throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Finds similar endpoints to the given endpoint
 */
export async function findSimilarEndpoints(endpoint, options) {
    const collection = await getCollection();
    const endpointId = `${endpoint.path}:${endpoint.method}`.toLowerCase();
    try {
        // First get the endpoint's vector
        const result = await collection.get({
            ids: [endpointId],
            include: ['documents']
        });
        if (!result.ids.length) {
            logger.warn(`Endpoint not found: ${endpointId}`);
            return [];
        }
        // Use the endpoint's document text to find similar endpoints
        const documentText = result.documents?.[0]?.[0];
        if (!documentText) {
            logger.warn(`No document text found for endpoint: ${endpointId}`);
            return [];
        }
        // Search for similar endpoints (excluding itself)
        const similar = await collection.query({
            queryTexts: [documentText],
            nResults: (options?.limit || DEFAULT_LIMIT) + 1, // +1 because we'll filter out self
            where: { id: { $ne: endpointId } },
            include: ['metadatas', 'distances']
        });
        // Process results (same as semanticSearch but with different metadata handling)
        const searchResults = [];
        for (let i = 0; i < (similar.ids?.[0]?.length || 0); i++) {
            const id = similar.ids[0][i];
            // Skip the endpoint itself if it somehow appears in results
            if (id === endpointId)
                continue;
            const metadata = similar.metadatas?.[0]?.[i] || {};
            const distance = similar.distances?.[0]?.[i] || 1;
            const score = 1 - distance;
            if (score < (options?.minScore || DEFAULT_MIN_SCORE))
                continue;
            searchResults.push({
                id,
                path: String(metadata.path || ''),
                method: String(metadata.method || ''),
                score: parseFloat(score.toFixed(4)),
                operationId: typeof metadata.operation_id === 'string' ? metadata.operation_id : undefined,
                tags: metadata.tags ? String(metadata.tags).split(',').filter(Boolean) : undefined
            });
            // Respect the limit (after filtering out self)
            if (searchResults.length >= (options?.limit || DEFAULT_LIMIT))
                break;
        }
        return searchResults;
    }
    catch (error) {
        logger.error('Failed to find similar endpoints:', error);
        throw error;
    }
}
