import { loadOpenAPI } from '../../openapi/loader.js';
import { validateFullOpenAPISpec } from '../../openapi/validator.js';
import { processOpenAPISpec } from '../../openapi/processor.js';
import { Logger } from '../../utils/logger.js';
export class APIService {
    constructor(verbose = false) {
        this.logger = Logger.getInstance(verbose);
    }
    async loadAndValidateSpec(specPath) {
        try {
            const spec = await loadOpenAPI(specPath);
            validateFullOpenAPISpec(spec);
            return spec;
        }
        catch (error) {
            this.logger.error('Failed to load or validate OpenAPI spec:', error);
            throw error;
        }
    }
    getAPIInfo(spec) {
        return {
            title: spec.info?.title || 'N/A',
            version: spec.info?.version || 'N/A',
            description: spec.info?.description?.split('\n')[0] +
                (spec.info?.description?.includes('\n') ? '...' : '') || 'N/A',
            endpointCount: Object.keys(spec.paths || {}).length
        };
    }
    processEndpoints(spec) {
        // Cast to any to avoid type conflicts between our types and openapi-types
        return processOpenAPISpec(spec);
    }
    groupEndpointsByTag(endpoints) {
        const grouped = {};
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
