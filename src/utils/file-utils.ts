import { promises as fs } from 'fs';
import path from 'path';

export interface FileOutputOptions {
  /** Output directory path (default: current directory) */
  outputDir?: string;
  
  /** Whether to create directory if it doesn't exist (default: true) */
  createDir?: boolean;
  
  /** Whether to format the JSON output (default: true) */
  pretty?: boolean;
}

/**
 * Save data to a JSON file
 * @param filename Name of the file (with or without .json extension)
 * @param data Data to save (will be converted to JSON)
 * @param options Output options
 */
export async function saveToJsonFile<T>(
  filename: string,
  data: T,
  options: FileOutputOptions = {}
): Promise<string> {
  const {
    outputDir = '.',
    createDir = true,
    pretty = true
  } = options;

  try {
    // Ensure output directory exists
    if (createDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    // Ensure .json extension
    const filePath = path.join(
      outputDir,
      filename.endsWith('.json') ? filename : `${filename}.json`
    );

    // Convert data to JSON string
    const jsonString = pretty 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // Write to file
    await fs.writeFile(filePath, jsonString, 'utf8');
    return filePath;
  } catch (error) {
    console.error('Error saving JSON file:', error);
    throw error;
  }
}

/**
 * Generate a timestamp-based filename
 * @param prefix Optional prefix for the filename
 * @returns Generated filename with timestamp
 */
export function generateTimestampFilename(prefix = 'output'): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, -5); // Remove timezone
  
  return `${prefix}_${timestamp}.json`;
}
