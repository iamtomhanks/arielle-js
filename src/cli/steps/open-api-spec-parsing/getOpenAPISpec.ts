import InteractionService from '../../../modules/cli/interaction-service.js';

export interface GetOpenAPISpecParams {
  specPath?: string;
  interactionService: InteractionService;
}

export async function getOpenAPISpecPath({
  specPath,
  interactionService,
}: GetOpenAPISpecParams): Promise<string> {
  // If no spec path was provided, prompt the user for one
  if (!specPath) {
    return await interactionService.promptForSpecPath();
  }
  return specPath;
}
