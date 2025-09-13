import { loadOpenAPI } from '../../openapi/loader.js';
import { validateFullOpenAPISpec } from '../../openapi/validator.js';
import { processOpenAPISpec } from '../../openapi/processor.js';
import type { OpenAPIV3 } from 'openapi-types';
import type { OpenAPISpec } from '../../openapi/types.js';
import { Logger } from '../../utils/logger.js';

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

export class APIService {
  private logger: Logger;

  constructor(verbose = false) {
    this.logger = Logger.getInstance(verbose);
  }

  async loadAndValidateSpec(specPath: string): Promise<OpenAPIV3.Document> {
    try {
      const spec: OpenAPIV3.Document = await loadOpenAPI(specPath) as OpenAPIV3.Document;
      validateFullOpenAPISpec(spec as unknown as OpenAPISpec);
      return spec;
    } catch (error) {
      this.logger.error('Failed to load or validate OpenAPI spec:', error);
      throw error;
    }
  }

  getAPIInfo(spec: OpenAPIV3.Document): APIInfo {
    return {
      title: spec.info?.title || 'N/A',
      version: spec.info?.version || 'N/A',
      description: spec.info?.description?.split('\n')[0] + 
                  (spec.info?.description?.includes('\n') ? '...' : '') || 'N/A',
      endpointCount: Object.keys(spec.paths || {}).length
    };
  }

  processEndpoints(spec: OpenAPIV3.Document): ProcessedEndpoint[] {
    // Cast to any to avoid type conflicts between our types and openapi-types
    return processOpenAPISpec(spec as any);
  }

  groupEndpointsByTag(endpoints: ProcessedEndpoint[]): Record<string, ProcessedEndpoint[]> {
    const grouped: Record<string, ProcessedEndpoint[]> = {};
    
    endpoints.forEach(endpoint => {
      const tag = endpoint.tags?.[0] || 'Other';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(endpoint);
    });

    return grouped;
  }
}

export default APIService;
