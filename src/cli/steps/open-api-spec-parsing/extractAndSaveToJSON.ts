import type { Ora } from 'ora';
import * as path from 'path';
import type { APIService } from '../../../modules/api/api-service.js';
import { generateTimestampFilename, saveToJsonFile } from '../../../utils/file-utils.js';

interface ExtractAndSaveToJSONParams {
  endpoints: any[];
  apiService: APIService;
  outputDir?: string;
  spinner: Ora;
}

export async function extractAndSaveToJSON({
  endpoints,
  apiService,
  outputDir = process.cwd(),
  spinner,
}: ExtractAndSaveToJSONParams): Promise<string> {
  // Extract endpoint information
  const extractedInfo = apiService.extractEndpointInfo(endpoints);

  // Save to JSON file
  const resolvedOutputDir = path.resolve(outputDir, 'phase2-output');
  const filename = generateTimestampFilename('api-extraction');
  const outputPath = await saveToJsonFile(filename, extractedInfo, {
    outputDir: resolvedOutputDir,
    createDir: true,
    pretty: true,
  });

  return outputPath;
}
