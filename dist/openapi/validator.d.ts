import { OpenAPISpec } from './types.js';
/**
 * Validates the structure of an OpenAPI specification
 * @param spec The OpenAPI specification object to validate
 * @returns The validated OpenAPI specification
 * @throws {Error} If the specification is invalid
 */
export declare function validateOpenAPISpec(spec: unknown): OpenAPISpec;
/**
 * Validates that all paths in the spec are valid
 * @param spec The OpenAPI specification to validate
 * @throws {Error} If any paths are invalid
 */
export declare function validatePaths(spec: OpenAPISpec): void;
/**
 * Validates that all references can be resolved
 * @param spec The OpenAPI specification to validate
 * @throws {Error} If any references cannot be resolved
 */
export declare function validateReferences(spec: OpenAPISpec): void;
/**
 * Performs comprehensive validation of an OpenAPI spec
 * @param spec The OpenAPI specification to validate
 * @returns The validated OpenAPI specification
 * @throws {Error} If the specification is invalid
 */
export declare function validateFullOpenAPISpec(spec: unknown): OpenAPISpec;
