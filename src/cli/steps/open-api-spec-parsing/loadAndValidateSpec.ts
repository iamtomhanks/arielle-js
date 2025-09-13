import type { OpenAPIV3 } from 'openapi-types';
import type { APIService } from '../../../modules/api/api-service.js';

interface LoadAndValidateSpecParams {
  specPath: string;
  apiService: APIService;
}

export async function loadAndValidateSpec({
  specPath,
  apiService,
}: LoadAndValidateSpecParams): Promise<OpenAPIV3.Document> {
  const spec = await apiService.loadAndValidateSpec(specPath);
  return spec;
}
