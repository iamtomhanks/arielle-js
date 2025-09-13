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

export class ExtractionService {
  /**
   * Extract "what" and "why" information from processed endpoints
   */
  extractEndpointInfo(endpoints: ProcessedEndpoint[]): ExtractedEndpointInfo[] {
    return endpoints.map(endpoint => {
      const info: ExtractedEndpointInfo = {
        id: this.generateEndpointId(endpoint),
        method: endpoint.method,
        path: endpoint.path,
        what: [],
        why: [],
        context: {
          tags: endpoint.tags || [],
          operationId: endpoint.operationId,
          deprecated: endpoint.deprecated || false
        }
      };

      // Extract "what" information
      if (endpoint.summary) {
        info.what.push(endpoint.summary);
      }

      if (endpoint.description) {
        // Check if description contains multiple paragraphs
        const paragraphs = endpoint.description.split('\n\n');
        
        // First paragraph is usually the "what"
        if (paragraphs.length > 0) {
          info.what.push(paragraphs[0].trim());
        }
        
        // Subsequent paragraphs are usually the "why"
        if (paragraphs.length > 1) {
          info.why.push(...paragraphs.slice(1).map(p => p.trim()).filter(Boolean));
        }
      }

      // Extract parameter descriptions
      if (endpoint.parameters?.length) {
        endpoint.parameters.forEach(param => {
          if (param.description) {
            info.what.push(`${param.name} (${param.in}): ${param.description}`);
          }
        });
      }

      // Extract request body description
      if (endpoint.requestBody?.description) {
        info.what.push(`Request Body: ${endpoint.requestBody.description}`);
      }

      // Extract response descriptions
      if (endpoint.responses) {
        Object.entries(endpoint.responses).forEach(([statusCode, response]) => {
          if (response.description) {
            info.what.push(`Response (${statusCode}): ${response.description}`);
          }
        });
      }

      // Add external documentation if available
      if (endpoint.externalDocs) {
        info.why.push(`External Documentation: ${endpoint.externalDocs.url}${endpoint.externalDocs.description ? ` - ${endpoint.externalDocs.description}` : ''}`);
      }

      return info;
    });
  }

  /**
   * Generate a unique ID for an endpoint
   */
  private generateEndpointId(endpoint: ProcessedEndpoint): string {
    if (endpoint.operationId) {
      return endpoint.operationId;
    }
    return `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[\{\}/]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '')}`;
  }

  /**
   * Format the extracted information for embedding
   */
  formatForEmbedding(extracted: ExtractedEndpointInfo[]): Array<{id: string; content: string}> {
    return extracted.map(item => ({
      id: item.id,
      content: [
        `# ${item.method.toUpperCase()} ${item.path}`,
        ...(item.what.length ? ['## What', ...item.what.map(w => `- ${w}`)] : []),
        ...(item.why.length ? ['## Why', ...item.why.map(w => `- ${w}`)] : []),
        ...(Object.keys(item.context).length ? ['## Context', `\`\`\`json\n${JSON.stringify(item.context, null, 2)}\n\`\`\``] : [])
      ].join('\n\n')
    }));
  }
}
