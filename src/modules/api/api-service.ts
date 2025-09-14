import type { OpenAPIV3 } from 'openapi-types';
import { loadOpenAPI } from '../../openapi/loader.js';
import { processOpenAPISpec } from '../../openapi/processor.js';
import type { OpenAPISpec } from '../../openapi/types.js';
import { validateFullOpenAPISpec } from '../../openapi/validator.js';
import { Logger } from '../../utils/logger.js';
import { ExtractedEndpointInfoEmbeddingFormat, ExtractionService } from './extraction-service.js';
import type { APIInfo, ProcessedEndpoint } from './types.js';
import type { LLMConfig } from '../../cli/steps/llm-selection/types.js';

export class APIService {
  private logger: Logger;
  private llmConfig: LLMConfig | null = null;

  constructor(verbose = false) {
    this.logger = Logger.getInstance(verbose);
  }

  async loadAndValidateSpec(specPath: string): Promise<OpenAPIV3.Document> {
    try {
      const spec: OpenAPIV3.Document = (await loadOpenAPI(specPath)) as OpenAPIV3.Document;
      validateFullOpenAPISpec(spec as unknown as OpenAPISpec);
      return spec;
    } catch (error) {
      this.logger.error('Failed to load or validate OpenAPI spec:', error);
      throw error;
    }
  }

  getAPIInfo(spec: OpenAPIV3.Document): APIInfo {
    const info: APIInfo = {
      title: spec.info?.title || 'Untitled API',
      version: spec.info?.version || '0.0.0',
      description: spec.info?.description || 'No description provided',
      endpointCount: 0,
    };

    // Count all endpoints
    if (spec.paths) {
      for (const path in spec.paths) {
        const pathItem = spec.paths[path];
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
          info.endpointCount += methods.filter((m) => (pathItem as any)[m]).length;
        }
      }
    }

    // Add contact info if available
    if (spec.info?.contact) {
      info.contact = {
        name: spec.info.contact.name,
        url: spec.info.contact.url,
        email: spec.info.contact.email,
      };
    }

    // Add license info if available
    if (spec.info?.license) {
      info.license = {
        name: spec.info.license.name,
        url: spec.info.license.url,
      };
    }

    // Add terms of service if available
    if (spec.info?.termsOfService) {
      info.termsOfService = spec.info.termsOfService;
    }

    return info;
  }

  processEndpoints(spec: OpenAPIV3.Document): ProcessedEndpoint[] {
    // First get the basic endpoints
    const basicEndpoints = processOpenAPISpec(spec as any) as any[];

    // Enhance with additional information
    return basicEndpoints.map((endpoint) => {
      const pathItem = spec.paths?.[endpoint.path];
      if (!pathItem) return endpoint as ProcessedEndpoint;

      const method = endpoint.method.toLowerCase();
      const operation = (pathItem as any)[method] as OpenAPIV3.OperationObject | undefined;

      if (!operation) return endpoint as ProcessedEndpoint;

      // Get all parameters (both path and operation level)
      const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
      const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];
      const allParameters = [
        ...pathParameters,
        ...operationParameters,
      ] as OpenAPIV3.ParameterObject[];

      // Format parameters
      const formattedParameters = allParameters.map((param) => ({
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required || false,
        schema: param.schema,
      }));

      // Format request body if exists
      let requestBody = undefined;
      if (operation.requestBody) {
        const requestBodyObj = operation.requestBody as OpenAPIV3.RequestBodyObject;
        requestBody = {
          description: requestBodyObj.description,
          content: requestBodyObj.content,
          required: requestBodyObj.required,
        };
      }

      // Format responses
      const responses: Record<string, any> = {};
      if (operation.responses) {
        Object.entries(operation.responses).forEach(([status, response]) => {
          const responseObj = response as OpenAPIV3.ResponseObject;
          responses[status] = {
            description: responseObj.description || '',
            content: responseObj.content || {},
          };
        });
      }

      // Create enhanced endpoint with all available information
      const enhancedEndpoint: ProcessedEndpoint = {
        ...endpoint,
        description: operation.description,
        operationId: operation.operationId,
        deprecated: operation.deprecated,
        security: operation.security as OpenAPIV3.SecurityRequirementObject[],
        servers: operation.servers,
        externalDocs: operation.externalDocs,
        parameters: formattedParameters,
        requestBody,
        responses,
      };

      // Add parameters with descriptions
      if (operation.parameters || pathItem.parameters) {
        const parameters = [
          ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
          ...(Array.isArray(operation.parameters) ? operation.parameters : []),
        ] as OpenAPIV3.ParameterObject[];

        enhancedEndpoint.parameters = parameters.map((param) => ({
          name: param.name,
          in: param.in,
          description: param.description,
          required: param.required || false,
          schema: param.schema,
        }));
      }

      // Add request body info
      if (operation.requestBody) {
        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        enhancedEndpoint.requestBody = {
          description: requestBody.description,
          content: requestBody.content,
        };
      }

      // Add responses info
      if (operation.responses) {
        enhancedEndpoint.responses = {};
        for (const [statusCode, response] of Object.entries(operation.responses)) {
          const responseObj = response as OpenAPIV3.ResponseObject;
          enhancedEndpoint.responses[statusCode] = {
            description: responseObj.description || '',
            content: responseObj.content,
          };
        }
      }

      return enhancedEndpoint;
    });
  }

  groupEndpointsByTag(endpoints: ProcessedEndpoint[]): Record<string, ProcessedEndpoint[]> {
    const grouped: Record<string, ProcessedEndpoint[]> = {};

    endpoints.forEach((endpoint) => {
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
  extractEndpointInfo(endpoints: ProcessedEndpoint[]): ExtractedEndpointInfoEmbeddingFormat[] {
    const extractionService = new ExtractionService();
    const extracted = extractionService.extractEndpointInfo(endpoints);
    return extractionService.formatForEmbedding(extracted);
  }

  /**
   * Set the LLM configuration for this service
   * @param config The LLM configuration to use
   */
  setLLMConfig(config: LLMConfig): void {
    this.llmConfig = config;
    this.logger.debug('LLM configuration updated:', JSON.stringify(config, null, 2));
  }

  /**
   * Get the current LLM configuration
   */
  getLLMConfig(): LLMConfig | null {
    return this.llmConfig;
  }
}

export default APIService;
