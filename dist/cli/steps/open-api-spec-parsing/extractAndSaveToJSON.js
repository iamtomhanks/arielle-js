import * as path from 'path';
import { generateTimestampFilename, saveToJsonFile } from '../../../utils/file-utils.js';
export async function extractAndSaveToJSON({ endpoints, apiService, outputDir = process.cwd(), spinner, }) {
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
