import { Command } from 'commander';
import { APIService } from '../modules/api/api-service.js';
import { InteractionService } from '../modules/cli/interaction-service.js';
import { Logger } from '../utils/logger.js';
export declare const startCommand: Command;
export declare const _private: {
    Logger: typeof Logger;
    APIService: typeof APIService;
    InteractionService: typeof InteractionService;
};
