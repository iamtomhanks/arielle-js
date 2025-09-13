import { OpenAPISpec } from './types.js';
/**
 * Loads and parses an OpenAPI specification from a file
 * @param filePath Path to the OpenAPI specification file (YAML or JSON)
 * @returns Parsed OpenAPI specification
 * @throws {Error} If the file cannot be read or parsed
 */
export declare function loadOpenAPISpec(filePath: string): Promise<OpenAPISpec>;
/**
 * Loads and parses an OpenAPI specification from a URL
 * @param url URL to the OpenAPI specification
 * @returns Parsed OpenAPI specification
 * @throws {Error} If the URL cannot be fetched or the content cannot be parsed
 */
export declare function loadOpenAPISpecFromUrl(url: string): Promise<OpenAPISpec>;
/**
 * Loads an OpenAPI specification from a file path or URL
 * @param source File path or URL to the OpenAPI specification
 * @returns Parsed OpenAPI specification
 * @throws {Error} If the source cannot be loaded or parsed
 */
export declare function loadOpenAPI(source: string): Promise<OpenAPISpec>;
