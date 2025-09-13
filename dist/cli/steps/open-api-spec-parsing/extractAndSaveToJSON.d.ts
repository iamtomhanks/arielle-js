import type { Ora } from 'ora';
import type { APIService } from '../../../modules/api/api-service.js';
import { ExtractedEndpointInfoEmbeddingFormat } from '../../../modules/api/extraction-service.js';
interface ExtractAndSaveToJSONResult {
    outputPath: string;
    extractedInfo: ExtractedEndpointInfoEmbeddingFormat[];
}
interface ExtractAndSaveToJSONParams {
    endpoints: any[];
    apiService: APIService;
    outputDir?: string;
    spinner: Ora;
}
export declare function extractAndSaveToJSON({ endpoints, apiService, outputDir, spinner, }: ExtractAndSaveToJSONParams): Promise<ExtractAndSaveToJSONResult>;
export {};
