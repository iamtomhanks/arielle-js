import { type Ora } from 'ora';
export declare function createProcessingSpinner(text: string): Ora;
export declare function updateSpinnerText(spinner: Ora, text: string): void;
export declare function succeedSpinner(spinner: Ora, message: string): void;
export declare function failSpinner(spinner: Ora, message: string): void;
export declare function stopSpinner(spinner: Ora): void;
