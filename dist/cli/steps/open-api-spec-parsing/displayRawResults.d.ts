import type { OpenAPIV3 } from 'openapi-types';
import type { APIService } from '../../../modules/api/api-service.js';
import type { InteractionService } from '../../../modules/cli/interaction-service.js';
interface DisplayRawResultsParams {
    spec: OpenAPIV3.Document;
    apiService: APIService;
    interactionService: InteractionService;
}
export declare function displayRawResults({ spec, apiService, interactionService, }: DisplayRawResultsParams): {
    endpoints: any[];
    endpointsByTag: Record<string, any[]>;
};
export {};
