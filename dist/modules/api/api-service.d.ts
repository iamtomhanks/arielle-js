import type { OpenAPIV3 } from 'openapi-types';
import type { APIInfo, ProcessedEndpoint } from './types.js';
export declare class APIService {
    private logger;
    constructor(verbose?: boolean);
    loadAndValidateSpec(specPath: string): Promise<OpenAPIV3.Document>;
    getAPIInfo(spec: OpenAPIV3.Document): APIInfo;
    processEndpoints(spec: OpenAPIV3.Document): ProcessedEndpoint[];
    groupEndpointsByTag(endpoints: ProcessedEndpoint[]): Record<string, ProcessedEndpoint[]>;
    /**
     * Extract "what" and "why" information from processed endpoints
     * @param endpoints The processed endpoints to extract information from
     * @returns Formatted text ready for embedding
     */
    extractEndpointInfo(endpoints: ProcessedEndpoint[]): Array<{
        id: string;
        content: string;
    }>;
}
export default APIService;
