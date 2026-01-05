/**
 * Docker Host Translation Utility
 *
 * When running inside Docker, the API container cannot reach localhost:9200
 * because localhost refers to the container itself, not the host machine.
 *
 * This utility translates localhost/127.0.0.1 URLs to the Docker network
 * service name (e.g., http://opensearch:9200) when OPENSEARCH_DOCKER_HOST
 * is set.
 */

/**
 * Translate a localhost OpenSearch URL to Docker internal URL if running in Docker.
 *
 * @param host - The host URL from the client (e.g., http://localhost:9200)
 * @returns The translated URL for Docker or the original URL
 */
export function translateHostForDocker(host: string): string {
  const dockerHost = process.env.OPENSEARCH_DOCKER_HOST;

  // If not running in Docker, return original URL
  if (!dockerHost) {
    return host;
  }

  // Check if the URL points to localhost or 127.0.0.1
  const isLocalhost =
    host.includes('localhost') || host.includes('127.0.0.1');

  if (isLocalhost) {
    // Use the Docker internal URL
    console.log(`[Docker] Translating ${host} -> ${dockerHost}`);
    return dockerHost;
  }

  // Not a localhost URL, return as-is
  return host;
}

/**
 * Check if the application is running inside Docker.
 */
export function isRunningInDocker(): boolean {
  return !!process.env.OPENSEARCH_DOCKER_HOST;
}
