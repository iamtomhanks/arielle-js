import { logger } from '../utils/logger.js';
import ora from 'ora';
/**
 * Processes an OpenAPI specification and extracts relevant information
 * @param spec The OpenAPI specification to process
 * @returns Array of processed endpoints
 */
export function processOpenAPISpec(spec) {
    const spinner = ora('Processing OpenAPI specification...').start();
    const results = [];
    try {
        const { paths } = spec;
        // Process each path and its methods
        for (const [path, pathItem] of Object.entries(paths)) {
            if (!pathItem || typeof pathItem !== 'object')
                continue;
            // Get all HTTP methods for this path
            const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];
            for (const method of methods) {
                const pathItemObj = pathItem;
                const operation = pathItemObj[method];
                if (!operation)
                    continue;
                try {
                    const pathItemObj = pathItem;
                    const processed = processOperation({
                        path,
                        method,
                        operation,
                        globalParameters: pathItemObj.parameters,
                        components: spec.components,
                    });
                    if (processed) {
                        results.push(processed);
                    }
                }
                catch (error) {
                    const err = error;
                    logger.warn(`Skipping operation ${method.toUpperCase()} ${path}: ${err.message}`);
                    continue;
                }
            }
        }
        spinner.succeed(`Processed ${results.length} endpoints`);
        return results;
    }
    catch (error) {
        spinner.fail('Failed to process OpenAPI specification');
        const err = error;
        logger.error(`Processing error: ${err.message}`);
        throw new Error(`Failed to process OpenAPI specification: ${err.message}`);
    }
}
/**
 * Processes a single API operation
 */
function processOperation(params) {
    const { path, method, operation, globalParameters, components } = params;
    const { operationId = '', summary = '', description = '', tags = [], parameters = [], requestBody, responses } = operation;
    // Resolve parameters (combine global and operation-specific)
    const allParameters = [...(globalParameters || []), ...parameters];
    const resolvedParameters = resolveParameters(allParameters, components);
    // Process request body
    const requestBodyInfo = requestBody ? processRequestBody(requestBody, components) : null;
    // Process responses
    const responseInfo = processResponses(responses, components);
    // Extract security requirements
    const securityRequirements = operation.security || [];
    // Generate text for NLP processing
    const nlpText = generateNlpText({
        path,
        method,
        operationId,
        summary,
        description,
        tags,
        parameters: resolvedParameters,
        requestBody: requestBodyInfo,
        responseInfo,
        securityRequirements,
    });
    return {
        path,
        method: method.toUpperCase(),
        operationId,
        summary,
        description,
        tags,
        nlpText,
        parameters: resolvedParameters,
        requestBody: requestBodyInfo,
        responses: responseInfo,
        security: securityRequirements,
    };
}
/**
 * Resolves parameters, handling references if needed
 */
function resolveParameters(parameters, components) {
    return parameters.map(param => {
        // Handle parameter references
        if ('$ref' in param) {
            const ref = param.$ref;
            if (!ref.startsWith('#/components/parameters/')) {
                logger.warn(`Unsupported parameter reference: ${ref}`);
                return { name: 'unknown', in: 'query' };
            }
            const paramName = ref.split('/').pop();
            if (!paramName || !components?.parameters?.[paramName]) {
                logger.warn(`Parameter reference not found: ${ref}`);
                return { name: 'unknown', in: 'query' };
            }
            const resolvedParam = components.parameters[paramName];
            if ('$ref' in resolvedParam) {
                // Handle nested references (not fully supported)
                logger.warn(`Nested parameter references are not fully supported: ${ref}`);
                return { name: paramName, in: 'query', ...resolvedParam };
            }
            return resolvedParam;
        }
        return param;
    });
}
/**
 * Processes request body, handling references if needed
 */
function processRequestBody(requestBody, components) {
    // Handle request body reference
    let resolvedBody;
    if ('$ref' in requestBody) {
        const ref = requestBody.$ref;
        if (!ref.startsWith('#/components/requestBodies/')) {
            logger.warn(`Unsupported request body reference: ${ref}`);
            return null;
        }
        const bodyName = ref.split('/').pop();
        if (!bodyName || !components?.requestBodies?.[bodyName]) {
            logger.warn(`Request body reference not found: ${ref}`);
            return null;
        }
        const resolved = components.requestBodies[bodyName];
        if ('$ref' in resolved) {
            // Handle nested references (not fully supported)
            logger.warn(`Nested request body references are not fully supported: ${ref}`);
            return null;
        }
        resolvedBody = resolved;
    }
    else {
        resolvedBody = requestBody;
    }
    // Extract content types and schema info
    const contentTypes = Object.keys(resolvedBody.content || {});
    const description = resolvedBody.description || '';
    const required = resolvedBody.required || false;
    return {
        description,
        required,
        contentTypes,
    };
}
/**
 * Processes responses
 */
function processResponses(responses, components) {
    return Object.entries(responses).map(([statusCode, response]) => {
        const description = response.description || '';
        const contentTypes = response.content ? Object.keys(response.content) : [];
        return {
            statusCode,
            description,
            contentTypes,
        };
    });
}
/**
 * Generates text for NLP processing
 */
function generateNlpText(params) {
    const { path, method, operationId, summary, description, tags, parameters, requestBody, responseInfo, securityRequirements, } = params;
    // Extract parameter information
    const paramTexts = parameters.map(param => {
        const required = param.required ? 'required' : 'optional';
        const inText = param.in ? `in ${param.in}` : '';
        const desc = param.description || '';
        return `${param.name} ${required} ${inText} ${desc}`.trim();
    });
    // Extract response information
    const responseTexts = responseInfo.map(resp => {
        return `${resp.statusCode} ${resp.description}`.trim();
    });
    // Combine all text parts
    const parts = [
        path,
        method,
        operationId,
        summary,
        description,
        ...tags,
        ...paramTexts,
        ...responseTexts,
    ];
    // Add request body info if present
    if (requestBody) {
        parts.push(`request body: ${requestBody.description || ''}`, ...(requestBody.contentTypes || []).map(ct => `content type: ${ct}`));
    }
    // Add security requirements if present
    if (securityRequirements.length > 0) {
        parts.push('security requirements:', JSON.stringify(securityRequirements));
    }
    // Join all parts, remove extra whitespace, and normalize
    return parts
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}
