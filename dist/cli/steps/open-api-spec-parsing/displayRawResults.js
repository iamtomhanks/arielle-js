export function displayRawResults({ spec, apiService, interactionService, }) {
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
