import { loadOpenAPI } from '../../openapi/loader.js';
import { validateFullOpenAPISpec } from '../../openapi/validator.js';
import { processOpenAPISpec } from '../../openapi/processor.js';
import { Logger } from '../../utils/logger.js';
import { ExtractionService } from './extraction-service.js';
export class APIService {
    constructor(verbose = false) {
        this.logger = Logger.getInstance(verbose);
    }
    async loadAndValidateSpec(specPath) {
        try {
            const spec = await loadOpenAPI(specPath);
            validateFullOpenAPISpec(spec);
            return spec;
        }
        catch (error) {
            this.logger.error('Failed to load or validate OpenAPI spec:', error);
            throw error;
        }
    }
    getAPIInfo(spec) {
        const info = {
            title: spec.info?.title || 'Untitled API',
            version: spec.info?.version || '0.0.0',
            description: spec.info?.description || 'No description provided',
            endpointCount: 0
        };
        // Count all endpoints
        if (spec.paths) {
            for (const path in spec.paths) {
                const pathItem = spec.paths[path];
                if (pathItem) {
                    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
                    info.endpointCount += methods.filter(m => pathItem[m]).length;
                }
            }
        }
        // Add contact info if available
        if (spec.info?.contact) {
            info.contact = {
                name: spec.info.contact.name,
                url: spec.info.contact.url,
                email: spec.info.contact.email
            };
        }
        // Add license info if available
        if (spec.info?.license) {
            info.license = {
                name: spec.info.license.name,
                url: spec.info.license.url
            };
        }
        // Add terms of service if available
        if (spec.info?.termsOfService) {
            info.termsOfService = spec.info.termsOfService;
        }
        return info;
    }
    processEndpoints(spec) {
        // First get the basic endpoints
        const basicEndpoints = processOpenAPISpec(spec);
        // Enhance with additional information
        return basicEndpoints.map(endpoint => {
            const pathItem = spec.paths?.[endpoint.path];
            if (!pathItem)
                return endpoint;
            const method = endpoint.method.toLowerCase();
            const operation = pathItem[method];
            if (!operation)
                return endpoint;
            // Get all parameters (both path and operation level)
            const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
            const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];
            const allParameters = [...pathParameters, ...operationParameters];
            // Format parameters
            const formattedParameters = allParameters.map(param => ({
                name: param.name,
                in: param.in,
                description: param.description,
                required: param.required || false,
                schema: param.schema
            }));
            // Format request body if exists
            let requestBody = undefined;
            if (operation.requestBody) {
                const requestBodyObj = operation.requestBody;
                requestBody = {
                    description: requestBodyObj.description,
                    content: requestBodyObj.content,
                    required: requestBodyObj.required
                };
            }
            // Format responses
            const responses = {};
            if (operation.responses) {
                Object.entries(operation.responses).forEach(([status, response]) => {
                    const responseObj = response;
                    responses[status] = {
                        description: responseObj.description || '',
                        content: responseObj.content || {}
                    };
                });
            }
            // Create enhanced endpoint with all available information
            const enhancedEndpoint = {
                ...endpoint,
                description: operation.description,
                operationId: operation.operationId,
                deprecated: operation.deprecated,
                security: operation.security,
                servers: operation.servers,
                externalDocs: operation.externalDocs,
                parameters: formattedParameters,
                requestBody,
                responses
            };
            // Add parameters with descriptions
            if (operation.parameters || pathItem.parameters) {
                const parameters = [
                    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
                    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
                ];
                enhancedEndpoint.parameters = parameters.map(param => ({
                    name: param.name,
                    in: param.in,
                    description: param.description,
                    required: param.required || false,
                    schema: param.schema
                }));
            }
            // Add request body info
            if (operation.requestBody) {
                const requestBody = operation.requestBody;
                enhancedEndpoint.requestBody = {
                    description: requestBody.description,
                    content: requestBody.content
                };
            }
            // Add responses info
            if (operation.responses) {
                enhancedEndpoint.responses = {};
                for (const [statusCode, response] of Object.entries(operation.responses)) {
                    const responseObj = response;
                    enhancedEndpoint.responses[statusCode] = {
                        description: responseObj.description || '',
                        content: responseObj.content
                    };
                }
            }
            return enhancedEndpoint;
        });
    }
    groupEndpointsByTag(endpoints) {
        const grouped = {};
        endpoints.forEach(endpoint => {
            const tag = endpoint.tags?.[0] || 'Other';
            if (!grouped[tag]) {
                grouped[tag] = [];
            }
            grouped[tag].push(endpoint);
        });
        return grouped;
    }
    /**
     * Extract "what" and "why" information from processed endpoints
     * @param endpoints The processed endpoints to extract information from
     * @returns Formatted text ready for embedding
     */
    extractEndpointInfo(endpoints) {
        const extractionService = new ExtractionService();
        const extracted = extractionService.extractEndpointInfo(endpoints);
        return extractionService.formatForEmbedding(extracted);
    }
}
export default APIService;
