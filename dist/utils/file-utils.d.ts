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
export declare function saveToJsonFile<T>(filename: string, data: T, options?: FileOutputOptions): Promise<string>;
/**
 * Generate a timestamp-based filename
 * @param prefix Optional prefix for the filename
 * @returns Generated filename with timestamp
 */
export declare function generateTimestampFilename(prefix?: string): string;
