import { ExtractedEndpointInfoEmbeddingFormat } from '../../../modules/api/extraction-service.js';
export interface UploadToVectorDBResult {
    success: boolean;
    collection?: any;
    error?: string;
}
export declare function uploadToVectorDB(collectionName: string, documents: ExtractedEndpointInfoEmbeddingFormat[], verbose?: boolean): Promise<UploadToVectorDBResult>;
