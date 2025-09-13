export declare class InteractionService {
    promptForSpecPath(): Promise<string>;
    displayAPIInfo(info: {
        title: string;
        version: string;
        description: string;
        endpointCount: number;
    }): void;
    displayEndpoints(endpointsByTag: Record<string, any[]>): void;
    displayCompletionMessage(): void;
}
export default InteractionService;
