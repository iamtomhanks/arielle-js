import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { logger } from '../utils/logger.js';
import { validateOpenAPISpec } from './validator.js';
/**
 * Loads and parses an OpenAPI specification from a file
 * @param filePath Path to the OpenAPI specification file (YAML or JSON)
 * @returns Parsed OpenAPI specification
 * @throws {Error} If the file cannot be read or parsed
 */
export async function loadOpenAPISpec(filePath) {
    try {
        const resolvedPath = path.resolve(filePath);
        logger.debug(`Loading OpenAPI spec from: ${resolvedPath}`);
        // Check if file exists and is readable
        try {
            await fs.access(resolvedPath, fs.constants.R_OK);
        }
        catch (error) {
            throw new Error(`File not found or not readable: ${resolvedPath}`);
        }
        // Read file content
        const content = await fs.readFile(resolvedPath, 'utf-8');
        // Parse based on file extension
        let parsed;
        const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');
        try {
            parsed = isYaml
                ? yaml.load(content, { json: true })
                : JSON.parse(content);
        }
        catch (parseError) {
            const error = parseError;
            const format = isYaml ? 'YAML' : 'JSON';
            throw new Error(`Failed to parse ${format} file: ${error.message}`);
        }
        // Validate the parsed content
        return validateOpenAPISpec(parsed);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to load OpenAPI spec: ${errorMessage}`);
        throw new Error(`Failed to load OpenAPI spec: ${errorMessage}`);
    }
}
/**
 * Loads and parses an OpenAPI specification from a URL
 * @param url URL to the OpenAPI specification
 * @returns Parsed OpenAPI specification
 * @throws {Error} If the URL cannot be fetched or the content cannot be parsed
 */
export async function loadOpenAPISpecFromUrl(url) {
    try {
        logger.debug(`Fetching OpenAPI spec from URL: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const isYaml = contentType.includes('application/yaml') ||
            contentType.includes('application/x-yaml') ||
            url.endsWith('.yaml') ||
            url.endsWith('.yml');
        let content;
        let parsed;
        try {
            content = await response.text();
            if (isJson) {
                parsed = JSON.parse(content);
            }
            else if (isYaml) {
                parsed = yaml.load(content, { json: true });
            }
            else {
                // Try to determine format from content
                try {
                    parsed = JSON.parse(content);
                }
                catch {
                    parsed = yaml.load(content, { json: true });
                }
            }
        }
        catch (parseError) {
            const error = parseError;
            throw new Error(`Failed to parse response: ${error.message}`);
        }
        // Validate the parsed content
        return validateOpenAPISpec(parsed);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to load OpenAPI spec from URL: ${errorMessage}`);
        throw new Error(`Failed to load OpenAPI spec from URL: ${errorMessage}`);
    }
}
/**
 * Loads an OpenAPI specification from a file path or URL
 * @param source File path or URL to the OpenAPI specification
 * @returns Parsed OpenAPI specification
 * @throws {Error} If the source cannot be loaded or parsed
 */
export async function loadOpenAPI(source) {
    try {
        // Check if source is a URL
        if (source.startsWith('http://') || source.startsWith('https://')) {
            return loadOpenAPISpecFromUrl(source);
        }
        // Otherwise treat as a file path
        return loadOpenAPISpec(source);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to load OpenAPI: ${errorMessage}`);
        throw new Error(`Failed to load OpenAPI: ${errorMessage}`);
    }
}
