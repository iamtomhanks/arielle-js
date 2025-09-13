import type { ProcessedEndpoint } from './types.js';
interface ExtractedEndpointInfo {
    /** The unique identifier for the endpoint */
    id: string;
    /** The HTTP method (GET, POST, etc.) */
    method: string;
    /** The API endpoint path */
    path: string;
    /** The "what" information - what this endpoint does */
    what: string[];
    /** The "why" information - why this endpoint exists and when to use it */
    why: string[];
    /** Any additional context that might be useful */
    context: Record<string, any>;
}
export declare class ExtractionService {
    /**
     * Extract "what" and "why" information from processed endpoints
     */
    extractEndpointInfo(endpoints: ProcessedEndpoint[]): ExtractedEndpointInfo[];
    /**
     * Generate a unique ID for an endpoint
     */
    private generateEndpointId;
    /**
     * Format the extracted information for embedding
     */
    formatForEmbedding(extracted: ExtractedEndpointInfo[]): Array<{
        id: string;
        content: string;
    }>;
    private formatParameters;
    private formatRequestBody;
    private formatResponses;
    private formatSchema;
    private determineEndpointPurpose;
}
export {};
