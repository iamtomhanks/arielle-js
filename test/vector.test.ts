// Use dynamic import for ESM modules
import { jest } from '@jest/globals';

// Import test utilities
const { describe, it, beforeAll, afterAll, expect } = jest;

// Import the module using dynamic import
let chromaModule: any;
let indexerModule: any;
let searcherModule: any;

beforeAll(async () => {
  // Dynamically import the modules
  chromaModule = await import('../src/vector/chroma-client.js');
  indexerModule = await import('../src/vector/indexer.js');
  searcherModule = await import('../src/vector/searcher.js');
});

// Extract the functions we need
const { getChromaClient, getCollection, resetClient } = chromaModule;
const { indexEndpoint, clearCollection, getDocumentCount } = indexerModule;
const { semanticSearch } = searcherModule;

describe('ChromaDB Integration', () => {
  beforeAll(async () => {
    // Ensure we have a clean state
    resetClient();
    const collection = await getCollection();
    await collection.delete({});
  });

  afterAll(async () => {
    // Clean up after tests
    const collection = await getCollection();
    await collection.delete({});
  });

  it('should connect to ChromaDB', async () => {
    const client = await getChromaClient();
    expect(client).toBeDefined();
    
    const heartbeat = await client.heartbeat();
    expect(heartbeat).toBeGreaterThan(0);
  });

  it('should index and search documents', async () => {
    // Test data
    const testEndpoints = [
      {
        id: 'test1',
        path: '/pets',
        method: 'GET',
        operationId: 'getPets',
        tags: ['pets'],
        nlpText: 'Get a list of all pets in the store',
        metadata: { test: true }
      },
      {
        id: 'test2',
        path: '/pets/{petId}',
        method: 'GET',
        operationId: 'getPetById',
        tags: ['pets'],
        nlpText: 'Get a specific pet by its ID',
        metadata: { test: true }
      }
    ];

    // Index test data
    for (const endpoint of testEndpoints) {
      await indexEndpoint(endpoint);
    }

    // Verify document count
    const count = await getDocumentCount();
    expect(count).toBe(testEndpoints.length);

    // Test search
    const results = await semanticSearch('find pets', { limit: 2 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].path).toBeDefined();
    expect(results[0].method).toBeDefined();
  });

  it('should clear the collection', async () => {
    await clearCollection();
    const count = await getDocumentCount();
    expect(count).toBe(0);
  });
});
