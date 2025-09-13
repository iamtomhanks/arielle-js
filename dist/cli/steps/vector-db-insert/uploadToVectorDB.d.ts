import { ExtractedEndpointInfoEmbeddingFormat } from '../../../modules/api/extraction-service.js';
export declare function uploadToVectorDB(collectionName: string, documents: ExtractedEndpointInfoEmbeddingFormat[], verbose?: boolean): Promise<boolean>;
