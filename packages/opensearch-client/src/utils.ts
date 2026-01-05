/**
 * Safely parse JSON response with Content-Type validation
 */
export async function safeParseJSON<T = unknown>(response: Response): Promise<T> {
  // Check Content-Type header
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const textResponse = await response.text();
    throw new Error(
      `Expected JSON response but got ${contentType || 'unknown type'}. ` +
      `Response (first 200 chars): ${textResponse.substring(0, 200)}`
    );
  }

  // Try to parse JSON
  try {
    return (await response.json()) as T;
  } catch (parseError) {
    const textResponse = await response.text();
    throw new Error(
      `Failed to parse JSON response. ` +
      `Response (first 200 chars): ${textResponse.substring(0, 200)}`
    );
  }
}
