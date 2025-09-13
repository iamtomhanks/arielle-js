export class ExtractionService {
    /**
     * Extract "what" and "why" information from processed endpoints
     */
    extractEndpointInfo(endpoints) {
        return endpoints.map(endpoint => {
            const info = {
                id: this.generateEndpointId(endpoint),
                method: endpoint.method,
                path: endpoint.path,
                what: [],
                why: [],
                context: {
                    tags: endpoint.tags || [],
                    operationId: endpoint.operationId,
                    deprecated: endpoint.deprecated || false,
                    method: endpoint.method,
                    path: endpoint.path
                }
            };
            // Extract "what" information
            if (endpoint.summary) {
                info.what.push(`**Summary**: ${endpoint.summary}`);
            }
            if (endpoint.description) {
                // Check if description contains multiple paragraphs
                const paragraphs = endpoint.description.split('\n\n');
                // First paragraph is usually the "what"
                if (paragraphs.length > 0) {
                    info.what.push(`**Description**: ${paragraphs[0].trim()}`);
                }
                // Subsequent paragraphs are usually the "why"
                if (paragraphs.length > 1) {
                    info.why.push(...paragraphs.slice(1).map(p => {
                        const trimmed = p.trim();
                        return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
                    }).filter(Boolean));
                }
            }
            // Add endpoint purpose based on HTTP method and path
            const purpose = this.determineEndpointPurpose(endpoint.method, endpoint.path);
            if (purpose) {
                info.what.push(`**Purpose**: ${purpose}`);
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
    generateEndpointId(endpoint) {
        if (endpoint.operationId) {
            return endpoint.operationId;
        }
        return `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[\{\}/]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '')}`;
    }
    /**
     * Format the extracted information for embedding
     */
    formatForEmbedding(extracted) {
        return extracted.map(item => {
            // Create a more structured content
            const sections = [
                `# ${item.method.toUpperCase()} ${item.path}`,
                ...(item.what.length ? ['## What This Endpoint Does', ...item.what.map(w => `- ${w}`)] : []),
                ...(item.why.length ? ['## Why This Endpoint Exists', ...item.why.map(w => `- ${w}`)] : []),
                ...(item.context.parameters?.length ? ['## Parameters', ...this.formatParameters(item.context.parameters)] : []),
                ...(item.context.requestBody ? ['## Request Body', this.formatRequestBody(item.context.requestBody)] : []),
                ...(item.context.responses ? ['## Responses', ...this.formatResponses(item.context.responses)] : [])
            ];
            // Only add context if there's more than just the basic info
            const hasAdditionalContext = Object.keys(item.context).length > 3; // More than just tags, operationId, deprecated
            if (hasAdditionalContext) {
                sections.push('## Technical Details', '```json', JSON.stringify({
                    operationId: item.context.operationId,
                    tags: item.context.tags,
                    deprecated: item.context.deprecated,
                    ...(item.context.security ? { security: item.context.security } : {})
                }, null, 2), '```');
            }
            return {
                id: item.id,
                content: sections.join('\n\n')
            };
        });
    }
    formatParameters(parameters) {
        return parameters.map(param => {
            const parts = [
                `- **${param.name}** (${param.in})`,
                param.required ? '**[Required]**' : '',
                param.description ? `\n  ${param.description}` : '',
                param.schema ? `\n  Type: ${this.formatSchema(param.schema)}` : ''
            ];
            return parts.filter(Boolean).join(' ');
        });
    }
    formatRequestBody(requestBody) {
        const parts = [];
        if (requestBody.description) {
            parts.push(`**Description**: ${requestBody.description}`);
        }
        if (requestBody.content) {
            const contentTypes = Object.entries(requestBody.content);
            parts.push('**Content Types:**');
            contentTypes.forEach(([contentType, content]) => {
                parts.push(`- ${contentType}:`);
                if (content.schema) {
                    parts.push(`  - Schema: ${this.formatSchema(content.schema)}`);
                }
            });
        }
        return parts.join('\n');
    }
    formatResponses(responses) {
        return Object.entries(responses).map(([status, response]) => {
            const parts = [
                `- **${status}**`,
                response.description ? `: ${response.description}` : ''
            ];
            if (response.content) {
                parts.push('\n  **Response Content:**');
                Object.entries(response.content).forEach(([contentType, content]) => {
                    parts.push(`  - ${contentType}:`);
                    if (content.schema) {
                        parts.push(`    - Schema: ${this.formatSchema(content.schema)}`);
                    }
                });
            }
            return parts.join('');
        });
    }
    formatSchema(schema) {
        if (!schema)
            return 'No schema defined';
        if (schema.type) {
            const type = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
            return `${type}${schema.format ? ` (${schema.format})` : ''}`;
        }
        if (schema.$ref) {
            return `Reference to ${schema.$ref.split('/').pop()}`;
        }
        return 'Complex schema - see details in OpenAPI spec';
    }
    determineEndpointPurpose(method, path) {
        const methodMap = {
            'get': 'Retrieve',
            'post': 'Create',
            'put': 'Update or replace',
            'patch': 'Partially update',
            'delete': 'Remove',
            'head': 'Check existence',
            'options': 'Get supported operations'
        };
        const pathParts = path.split('/').filter(Boolean);
        const resource = pathParts[0] || 'resource';
        const isPlural = resource.endsWith('s') && !['status', 'settings'].includes(resource);
        const resourceName = isPlural ? resource.slice(0, -1) : resource;
        const action = methodMap[method.toLowerCase()] || 'Process';
        if (pathParts.length > 1 && pathParts[1].startsWith('{')) {
            // Path with ID parameter (e.g., /pets/{id})
            return `${action} a specific ${resourceName} by ID`;
        }
        if (method.toLowerCase() === 'get' && pathParts.length > 1) {
            // Nested resource (e.g., /pets/{id}/owner)
            const subResource = pathParts[2] || '';
            return `Get ${subResource} for a specific ${resourceName}`;
        }
        return `${action} ${isPlural ? 'all ' : ''}${resourceName}${isPlural ? 's' : ''}`;
    }
}
