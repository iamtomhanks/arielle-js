import { OpenAPISpec, ParameterObject } from './types.js';
/**
 * Processes an OpenAPI specification and extracts relevant information
 * @param spec The OpenAPI specification to process
 * @returns Array of processed endpoints
 */
export declare function processOpenAPISpec(spec: OpenAPISpec): ProcessedEndpoint[];
export interface ProcessedEndpoint {
    path: string;
    method: string;
    operationId: string;
    summary: string;
    description: string;
    tags: string[];
    nlpText: string;
    parameters: ParameterObject[];
    requestBody: RequestBodyInfo | null;
    responses: ResponseInfo[];
    security: any[];
}
interface RequestBodyInfo {
    description: string;
    required: boolean;
    contentTypes: string[];
}
interface ResponseInfo {
    statusCode: string;
    description: string;
    contentTypes: string[];
}
export {};
