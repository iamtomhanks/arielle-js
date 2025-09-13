import InteractionService from '../../../modules/cli/interaction-service.js';
export interface GetOpenAPISpecParams {
    specPath?: string;
    interactionService: InteractionService;
}
export declare function getOpenAPISpecPath({ specPath, interactionService, }: GetOpenAPISpecParams): Promise<string>;
