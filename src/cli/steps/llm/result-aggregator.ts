/**
 * Aggregates and formats results from multiple intents into a single response
 * @param results Array of { intent: string, result: any } objects
 * @returns Formatted string with combined results
 */
export function aggregateResults(results: Array<{ intent: string; result: any }>): string {
  if (results.length === 0) {
    return 'No results found for your query.';
  }

  // If there's only one result, return it directly
  if (results.length === 1) {
    return results[0].result.answer || 'No answer found for this query.';
  }

  // For multiple intents, format as an action plan
  const sections = results.map(({ intent, result }, index) => {
    const answer = result.answer || 'No specific information found.';
    return `## ${index + 1}. ${intent}\n\n${answer}\n`;
  });

  return [
    '# Action Plan',
    'Based on your query, here are the steps to accomplish your goal:',
    '',
    ...sections,
    '---\nYou can ask follow-up questions about any of these steps for more details.'
  ].join('\n');
}

/**
 * Handles partial failures in multi-intent processing
 * @param results Array of successful results
 * @param errors Array of errors that occurred
 * @returns Formatted error message or null if no errors
 */
export function handlePartialFailures(
  results: any[],
  errors: Array<{ intent: string; error: Error }>
): string | null {
  if (errors.length === 0) return null;

  const errorMessages = errors.map(
    ({ intent, error }) => 
      `- Intent: ${intent}\n  Error: ${error.message || 'Unknown error'}`
  );

  return [
    '⚠️ Some parts of your query could not be processed:',
    ...errorMessages,
    '\nYou can try rephrasing these parts or ask about them separately.'
  ].join('\n');
}
