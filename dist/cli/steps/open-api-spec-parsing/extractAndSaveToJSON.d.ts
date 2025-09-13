import type { Ora } from 'ora';
import type { APIService } from '../../../modules/api/api-service.js';
interface ExtractAndSaveToJSONParams {
    endpoints: any[];
    apiService: APIService;
    outputDir?: string;
    spinner: Ora;
}
export declare function extractAndSaveToJSON({ endpoints, apiService, outputDir, spinner, }: ExtractAndSaveToJSONParams): Promise<string>;
export {};
