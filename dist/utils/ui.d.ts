export declare class UI {
    static showBanner(): void;
    static section(title: string): void;
    static success(message: string): void;
    static error(message: string): void;
    static warning(message: string): void;
    static info(message: string): void;
    static divider(): void;
    static box(content: string, title?: string): void;
    static table(rows: string[][], headers?: string[]): void;
}
