import type { OpenAPIV3 } from 'openapi-types';
export interface APIInfo {
    title: string;
    version: string;
    description: string;
    endpointCount: number;
}
export interface ProcessedEndpoint {
    method: string;
    path: string;
    summary?: string;
    tags?: string[];
    parameters?: any[];
}
export declare class APIService {
    private logger;
    constructor(verbose?: boolean);
    loadAndValidateSpec(specPath: string): Promise<OpenAPIV3.Document>;
    getAPIInfo(spec: OpenAPIV3.Document): APIInfo;
    processEndpoints(spec: OpenAPIV3.Document): ProcessedEndpoint[];
    groupEndpointsByTag(endpoints: ProcessedEndpoint[]): Record<string, ProcessedEndpoint[]>;
}
export default APIService;
