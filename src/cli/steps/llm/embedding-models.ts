export interface EmbeddingModelConfig {
  name: string;
  dimensions: number;
  provider: 'openai' | 'google' | 'huggingface' | 'custom';
}

export const EMBEDDING_MODELS: Record<string, EmbeddingModelConfig> = {
  'text-embedding-3-small': {
    name: 'text-embedding-3-small',
    dimensions: 1536,
    provider: 'openai',
  },
  'text-embedding-3-large': {
    name: 'text-embedding-3-large',
    dimensions: 3072,
    provider: 'openai',
  },
  'text-embedding-004': {
    name: 'text-embedding-004',
    dimensions: 768,
    provider: 'google',
  },
  // Add more models as needed
};

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

export function getEmbeddingDimensions(modelName: string): number {
  const model = EMBEDDING_MODELS[modelName];
  if (!model) {
    console.warn(`Unknown embedding model: ${modelName}. Using default dimensions.`);
    return EMBEDDING_MODELS[DEFAULT_EMBEDDING_MODEL].dimensions;
  }
  return model.dimensions;
}

export function validateEmbeddingDimensions(embedding: number[], expectedDimensions: number): boolean {
  return embedding.length === expectedDimensions;
}
