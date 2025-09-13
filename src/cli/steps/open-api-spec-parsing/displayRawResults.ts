import type { OpenAPIV3 } from 'openapi-types';
import type { APIService } from '../../../modules/api/api-service.js';
import type { InteractionService } from '../../../modules/cli/interaction-service.js';

interface DisplayRawResultsParams {
  spec: OpenAPIV3.Document;
  apiService: APIService;
  interactionService: InteractionService;
}

export function displayRawResults({
  spec,
  apiService,
  interactionService,
}: DisplayRawResultsParams): {
  endpoints: any[];
  endpointsByTag: Record<string, any[]>;
} {
  // Process endpoints
  const endpoints = apiService.processEndpoints(spec);
  const endpointsByTag = apiService.groupEndpointsByTag(endpoints);

  // Display API information
  const apiInfo = apiService.getAPIInfo(spec);
  interactionService.displayAPIInfo(apiInfo);

  // Display endpoints
  interactionService.displayEndpoints(endpointsByTag);

  return { endpoints, endpointsByTag };
}
