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

export interface ExtractedEndpointInfo {
  // Core identification
  id: string;
  method: string;
  path: string;
  
  // Human-readable descriptions
  what: string[];
  why: string[];
  
  // Context and metadata
  context: {
    // Standard OpenAPI fields
    tags: string[];
    operationId?: string;
    deprecated: boolean;
    description?: string;
    
    // Request information
    parameters?: Array<{
      name: string;
      in: string;
      description?: string;
      required: boolean;
      schema?: any;
    }>;
    
    requestBody?: {
      description?: string;
      required?: boolean;
      content?: Record<string, any>;
    };
    
    // Response information
    responses?: Record<string, {
      description: string;
      content?: Record<string, any>;
    }>;
    
    // Security
    security?: any[];
    
    // Allow additional properties
    [key: string]: any;
  };
  
  // Additional fields added for embedding
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: Array<{
    name: string;
    in: string;
    description?: string;
    required: boolean;
    schema?: any;
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, any>;
  };
  responses?: Record<string, {
    description: string;
    content?: Record<string, any>;
  }>;
  deprecated?: boolean;
  security?: any[];
}
