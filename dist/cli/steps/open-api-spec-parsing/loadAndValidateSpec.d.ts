import type { OpenAPIV3 } from 'openapi-types';
import type { APIService } from '../../../modules/api/api-service.js';
interface LoadAndValidateSpecParams {
    specPath: string;
    apiService: APIService;
}
export declare function loadAndValidateSpec({ specPath, apiService, }: LoadAndValidateSpecParams): Promise<OpenAPIV3.Document>;
export {};
