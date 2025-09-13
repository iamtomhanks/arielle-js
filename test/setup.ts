import { jest } from '@jest/globals';

// Set test timeout to 30 seconds
jest.setTimeout(30000);

// Mock logger to avoid cluttering test output
jest.mock('../src/utils/logger.js', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.CHROMA_SERVER_URL = 'http://localhost:8000'; // Default ChromaDB URL
