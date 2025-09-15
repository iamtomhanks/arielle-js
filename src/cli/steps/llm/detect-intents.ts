import fs from 'fs/promises';
import path from 'path';
import mustache from 'mustache';
import { LLMProviderInterface } from './types/llm.types.js';

// Path to the intent detection prompt template
const INTENT_DETECTION_PROMPT = path.join(
  __dirname,
  'prompts/intent-detection.mustache'
);

/**
 * Detects individual intents from a complex question
 * @param question The user's original question
 * @param llm The LLM provider instance
 * @returns Array of detected intents, each prefixed with "What are all the ways I can..."
 */
export async function detectIntents(
  question: string,
  llm: LLMProviderInterface
): Promise<string[]> {
  try {
    // Load the prompt template
    const template = await fs.readFile(INTENT_DETECTION_PROMPT, 'utf-8');
    
    // Render the prompt with the user's question
    const prompt = mustache.render(template, { question });
    
    // Get the LLM's response
    const response = await llm.generateText({
      prompt,
      maxTokens: 500,
      temperature: 0.3,
    });
    
    // Parse the response into individual intents
    const intents = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.match(/^\d+\./)) // Only keep numbered lines
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    // If no intents were detected, use the original question
    return intents.length > 0 ? intents : [question];
    
  } catch (error) {
    console.error('Error detecting intents:', error);
    // Fallback to original question if intent detection fails
    return [question];
  }
}

/**
 * Helper function to format a single intent with the standard prefix
 */
export function formatIntent(intent: string): string {
  intent = intent.trim();
  const prefix = 'What are all the ways I can';
  
  // Check if the intent already starts with the prefix
  if (intent.toLowerCase().startsWith(prefix.toLowerCase())) {
    return intent;
  }
  
  // Add the prefix if it's not already there
  return `${prefix} ${intent.replace(/^[\s\w]*/, '').trim()}`;
}
