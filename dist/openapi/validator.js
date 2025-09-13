import { logger } from '../utils/logger.js';
/**
 * Validates the structure of an OpenAPI specification
 * @param spec The OpenAPI specification object to validate
 * @returns The validated OpenAPI specification
 * @throws {Error} If the specification is invalid
 */
export function validateOpenAPISpec(spec) {
    if (!spec || typeof spec !== 'object') {
        throw new Error('Invalid OpenAPI spec: must be an object');
    }
    const specObj = spec;
    // Check for required top-level fields
    if (!('openapi' in specObj) || typeof specObj.openapi !== 'string') {
        throw new Error('Invalid OpenAPI spec: missing or invalid openapi version');
    }
    // Validate version is 3.0.x
    if (!specObj.openapi.startsWith('3.0.')) {
        logger.warn(`OpenAPI version ${specObj.openapi} detected. This tool is tested with OpenAPI 3.0.x`);
    }
    // Check for required info object
    if (!('info' in specObj) || typeof specObj.info !== 'object' || !specObj.info) {
        throw new Error('Invalid OpenAPI spec: missing or invalid info object');
    }
    const info = specObj.info;
    // Check required info fields
    if (!('title' in info) || typeof info.title !== 'string') {
        throw new Error('Invalid OpenAPI spec: missing or invalid info.title');
    }
    if (!('version' in info) || typeof info.version !== 'string') {
        throw new Error('Invalid OpenAPI spec: missing or invalid info.version');
    }
    // Check paths
    if (!('paths' in specObj) || typeof specObj.paths !== 'object' || !specObj.paths) {
        throw new Error('Invalid OpenAPI spec: missing or invalid paths object');
    }
    // Validate components if present
    if ('components' in specObj && specObj.components) {
        if (typeof specObj.components !== 'object') {
            throw new Error('Invalid OpenAPI spec: components must be an object');
        }
    }
    // Validate servers array if present
    if ('servers' in specObj && specObj.servers) {
        if (!Array.isArray(specObj.servers)) {
            throw new Error('Invalid OpenAPI spec: servers must be an array');
        }
    }
    // Validate security requirements if present
    if ('security' in specObj && specObj.security) {
        if (!Array.isArray(specObj.security)) {
            throw new Error('Invalid OpenAPI spec: security must be an array');
        }
    }
    // Validate tags if present
    if ('tags' in specObj && specObj.tags) {
        if (!Array.isArray(specObj.tags)) {
            throw new Error('Invalid OpenAPI spec: tags must be an array');
        }
    }
    // If we got here, the spec is valid enough for our purposes
    return spec;
}
/**
 * Validates that all paths in the spec are valid
 * @param spec The OpenAPI specification to validate
 * @throws {Error} If any paths are invalid
 */
export function validatePaths(spec) {
    const paths = spec.paths;
    for (const [path, pathItem] of Object.entries(paths)) {
        if (!path.startsWith('/')) {
            throw new Error(`Invalid path '${path}': must start with a forward slash`);
        }
        // Cast pathItem to any to avoid TypeScript errors
        const pathItemObj = pathItem;
        // Check for path parameters that aren't defined in the path
        if (pathItemObj.parameters && Array.isArray(pathItemObj.parameters)) {
            for (const param of pathItemObj.parameters) {
                if ('in' in param && param.in === 'path') {
                    const paramName = param.name;
                    if (!path.includes(`{${paramName}}`)) {
                        logger.warn(`Path parameter '${paramName}' is defined but not used in path '${path}'`);
                    }
                }
            }
        }
    }
}
/**
 * Validates that all references can be resolved
 * @param spec The OpenAPI specification to validate
 * @throws {Error} If any references cannot be resolved
 */
export function validateReferences(spec) {
    // This is a simplified version that just checks for the existence of components
    // A full implementation would traverse the entire spec and check all $ref values
    if (!spec.components) {
        return; // No components, so no references to validate
    }
    const checkRef = (ref, context) => {
        if (!ref.startsWith('#/components/')) {
            logger.warn(`External reference '${ref}' found in ${context}. External references are not fully supported.`);
            return;
        }
        const parts = ref.split('/');
        if (parts.length < 4) {
            throw new Error(`Invalid reference '${ref}' in ${context}: malformed reference`);
        }
        const componentType = parts[2];
        const componentName = parts[3];
        if (!(componentType in spec.components)) {
            throw new Error(`Invalid reference '${ref}' in ${context}: component type '${componentType}' not found`);
        }
        const components = spec.components;
        if (!(componentName in components[componentType])) {
            throw new Error(`Invalid reference '${ref}' in ${context}: component '${componentName}' not found in ${componentType}`);
        }
    };
    // Check components for references
    for (const [componentType, components] of Object.entries(spec.components)) {
        if (!components || typeof components !== 'object')
            continue;
        for (const [name, component] of Object.entries(components)) {
            if (!component || typeof component !== 'object')
                continue;
            // Check for $ref in component
            if ('$ref' in component && typeof component.$ref === 'string') {
                checkRef(component.$ref, `components.${componentType}.${name}`);
            }
            // TODO: Recursively check nested objects for references
        }
    }
}
/**
 * Performs comprehensive validation of an OpenAPI spec
 * @param spec The OpenAPI specification to validate
 * @returns The validated OpenAPI specification
 * @throws {Error} If the specification is invalid
 */
export function validateFullOpenAPISpec(spec) {
    // Basic structure validation
    const validatedSpec = validateOpenAPISpec(spec);
    // Additional validations
    validatePaths(validatedSpec);
    validateReferences(validatedSpec);
    return validatedSpec;
}
