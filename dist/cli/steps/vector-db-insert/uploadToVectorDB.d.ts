import { ExtractedEndpointInfoEmbeddingFormat } from '../../../modules/api/extraction-service.js';
import { BaseLLMProvider } from '../llm/base-llm-provider.js';
export interface UploadToVectorDBResult {
    success: boolean;
    collection?: any;
    error?: string;
}
export declare function uploadToVectorDB(collectionName: string, documents: ExtractedEndpointInfoEmbeddingFormat[], provider: BaseLLMProvider, verbose?: boolean): Promise<UploadToVectorDBResult>;
