import type { OpenAPIV3 } from 'openapi-types';
import { ExtractedEndpointInfoEmbeddingFormat } from './extraction-service.js';
import type { APIInfo, ProcessedEndpoint } from './types.js';
import type { LLMConfig } from '../../cli/steps/llm-selection/types.js';
export declare class APIService {
    private logger;
    private llmConfig;
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
    extractEndpointInfo(endpoints: ProcessedEndpoint[]): ExtractedEndpointInfoEmbeddingFormat[];
    /**
     * Set the LLM configuration for this service
     * @param config The LLM configuration to use
     */
    setLLMConfig(config: LLMConfig): void;
    /**
     * Get the current LLM configuration
     */
    getLLMConfig(): LLMConfig | null;
}
export default APIService;
