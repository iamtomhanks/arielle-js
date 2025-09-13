import type { OpenAPIV3 } from 'openapi-types';

export interface ProcessedEndpoint {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  
  /** API endpoint path */
  path: string;
  
  /** Short summary of the endpoint */
  summary?: string;
  
  /** Detailed description of the endpoint */
  description?: string;
  
  /** Tags/categories for the endpoint */
  tags?: string[];
  
  /** List of parameters with their descriptions */
  parameters?: Array<{
    name: string;
    in: string;
    description?: string;
    required?: boolean;
    schema?: any;
  }>;
  
  /** Request body description if applicable */
  requestBody?: {
    description?: string;
    content?: Record<string, any>;
  };
  
  /** Response descriptions by status code */
  responses?: Record<string, {
    description: string;
    content?: Record<string, any>;
  }>;
  
  /** Operation ID if available */
  operationId?: string;
  
  /** Whether the endpoint is deprecated */
  deprecated?: boolean;
  
  /** Security requirements */
  security?: OpenAPIV3.SecurityRequirementObject[];
  
  /** Server information */
  servers?: OpenAPIV3.ServerObject[];
  
  /** External documentation */
  externalDocs?: OpenAPIV3.ExternalDocumentationObject;
}

export interface APIInfo {
  /** API title */
  title: string;
  
  /** API version */
  version: string;
  
  /** Detailed API description */
  description: string;
  
  /** Count of available endpoints */
  endpointCount: number;
  
  /** Contact information if available */
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  
  /** License information if available */
  license?: {
    name: string;
    url?: string;
  };
  
  /** Terms of service URL if available */
  termsOfService?: string;
}
