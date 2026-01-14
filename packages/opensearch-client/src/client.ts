import type {
  ConnectionConfig,
  IndexInfo,
  IndexMapping,
  SearchResponse,
  ClusterHealth,
  OpenSearchError,
  AuthConfig,
} from './types';
import type { Aggregation } from '@crystal-forge/query-dsl';
import { safeParseJSON } from './utils';

/**
 * HTTP method types
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

/**
 * Request options for internal HTTP calls
 */
interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * OpenSearch client error class
 */
export class OpenSearchClientError extends Error {
  public readonly statusCode?: number;
  public readonly opensearchError?: OpenSearchError;

  constructor(
    message: string,
    statusCode?: number,
    opensearchError?: OpenSearchError
  ) {
    super(message);
    this.name = 'OpenSearchClientError';
    this.statusCode = statusCode;
    this.opensearchError = opensearchError;
  }
}

/**
 * OpenSearch client for connecting to and querying OpenSearch clusters
 */
export class OpenSearchClient {
  private readonly config: ConnectionConfig;
  private readonly baseUrl: string;
  private connected: boolean = false;

  /**
   * Create a new OpenSearch client
   * @param config - Connection configuration
   */
  constructor(config: ConnectionConfig) {
    this.config = {
      timeout: 30000,
      verifySsl: true,
      ...config,
    };

    // Normalize the host URL (remove trailing slash)
    this.baseUrl = config.host.replace(/\/$/, '');
  }

  /**
   * Build authorization header based on auth config
   */
  private getAuthHeader(auth: AuthConfig): string {
    switch (auth.type) {
      case 'basic': {
        const credentials = Buffer.from(
          `${auth.username}:${auth.password}`
        ).toString('base64');
        return `Basic ${credentials}`;
      }
      case 'apiKey': {
        return `ApiKey ${auth.apiKey}`;
      }
      case 'awsSigV4': {
        // AWS SigV4 requires runtime signing - placeholder for now
        // In production, this would use @aws-sdk/signature-v4
        throw new OpenSearchClientError(
          'AWS SigV4 authentication requires additional implementation'
        );
      }
      default: {
        const _exhaustive: never = auth;
        throw new OpenSearchClientError(`Unknown auth type: ${_exhaustive}`);
      }
    }
  }

  /**
   * Make an HTTP request to the OpenSearch cluster
   */
  private async _request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, timeout } = options;

    const url = `${this.baseUrl}${path}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    // Add authentication header if configured
    if (this.config.auth) {
      requestHeaders['Authorization'] = this.getAuthHeader(this.config.auth);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout ?? this.config.timeout ?? 30000
    );

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await safeParseJSON(response);

      if (!response.ok) {
        const opensearchError = responseData as OpenSearchError;
        throw new OpenSearchClientError(
          opensearchError.error?.reason ?? `HTTP ${response.status}`,
          response.status,
          opensearchError
        );
      }

      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OpenSearchClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new OpenSearchClientError('Request timed out');
        }
        throw new OpenSearchClientError(`Request failed: ${error.message}`);
      }

      throw new OpenSearchClientError('Unknown error occurred');
    }
  }

  /**
   * Validate the connection to the OpenSearch cluster
   * @returns true if connection is successful
   * @throws OpenSearchClientError if connection fails
   */
  async connect(): Promise<boolean> {
    try {
      // Make a simple request to verify connectivity
      await this._request<Record<string, unknown>>('/');
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the cluster health status
   */
  async getClusterHealth(): Promise<ClusterHealth> {
    return this._request<ClusterHealth>('/_cluster/health');
  }

  /**
   * List all indices in the cluster
   * @param pattern - Optional index pattern to filter (e.g., "logs-*")
   */
  async getIndices(pattern?: string): Promise<IndexInfo[]> {
    const indexPath = pattern ? `/${encodeURIComponent(pattern)}` : '';

    interface CatIndexResponse {
      index: string;
      uuid: string;
      health: 'green' | 'yellow' | 'red';
      status: 'open' | 'close';
      pri: string;
      rep: string;
      'docs.count': string;
      'docs.deleted': string;
      'store.size': string;
      'pri.store.size': string;
    }

    const indices = await this._request<CatIndexResponse[]>(
      `/_cat/indices${indexPath}?format=json&h=index,uuid,health,status,pri,rep,docs.count,docs.deleted,store.size,pri.store.size`
    );

    return indices.map((idx) => ({
      name: idx.index,
      uuid: idx.uuid,
      health: idx.health,
      status: idx.status,
      primaryShards: parseInt(idx.pri, 10) || 0,
      replicaShards: parseInt(idx.rep, 10) || 0,
      docsCount: parseInt(idx['docs.count'], 10) || 0,
      docsDeleted: parseInt(idx['docs.deleted'], 10) || 0,
      storeSize: idx['pri.store.size'] || '0b',
      storeSizeBytes: this.parseSize(idx['pri.store.size'] || '0b'),
    }));
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 ** 2,
      gb: 1024 ** 3,
      tb: 1024 ** 4,
    };

    const match = sizeStr.toLowerCase().match(/^([\d.]+)([a-z]+)$/);
    if (!match) return 0;

    const [, value, unit] = match;
    return Math.floor(parseFloat(value) * (units[unit] || 1));
  }

  /**
   * Get the mapping for an index
   * @param index - Index name or pattern
   */
  async getMapping(index: string): Promise<IndexMapping> {
    type MappingResponse = Record<
      string,
      {
        mappings: IndexMapping['mappings'];
      }
    >;

    const response = await this._request<MappingResponse>(
      `/${encodeURIComponent(index)}/_mapping`
    );

    // Get the first index's mapping (in case of pattern matching)
    const indexName = Object.keys(response)[0];
    if (!indexName) {
      throw new OpenSearchClientError(`No mapping found for index: ${index}`);
    }

    return {
      index: indexName,
      mappings: response[indexName].mappings,
    };
  }

  /**
   * Execute a search query
   * @param index - Index name or pattern to search
   * @param query - OpenSearch query DSL object (can be null for aggregation-only requests)
   * @param aggregations - Optional array of aggregations to include in the search
   */
  async search<T = Record<string, unknown>>(
    index: string,
    query: object | null,
    aggregations?: Aggregation[]
  ): Promise<SearchResponse<T>> {
    // Build the request body
    const body: Record<string, unknown> = {};

    if (query) {
      body.query = query;
    }

    if (aggregations && aggregations.length > 0) {
      // Serialize aggregations to OpenSearch format
      body.aggs = aggregations.reduce((acc, agg) => {
        // Extract aggregation parameters (everything except name and type)
        const { name, type, ...params } = agg as unknown as Record<string, unknown>;
        acc[name as string] = {
          [type as string]: params,
        };
        return acc;
      }, {} as Record<string, unknown>);
    }

    return this._request<SearchResponse<T>>(
      `/${encodeURIComponent(index)}/_search`,
      {
        method: 'POST',
        body,
      }
    );
  }

  /**
   * Execute a multi-search query
   * @param requests - Array of index/query pairs
   */
  async msearch<T = Record<string, unknown>>(
    requests: Array<{ index: string; query: object }>
  ): Promise<{ responses: SearchResponse<T>[] }> {
    // Multi-search uses newline-delimited JSON
    const body = requests
      .flatMap(({ index, query }) => [
        JSON.stringify({ index }),
        JSON.stringify(query),
      ])
      .join('\n') + '\n';

    const response = await fetch(`${this.baseUrl}/_msearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Accept: 'application/json',
        ...(this.config.auth
          ? { Authorization: this.getAuthHeader(this.config.auth) }
          : {}),
      },
      body,
    });

    if (!response.ok) {
      const errorData = await safeParseJSON<OpenSearchError>(response);
      throw new OpenSearchClientError(
        errorData.error?.reason ?? `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return safeParseJSON<{ responses: SearchResponse<T>[] }>(response);
  }

  /**
   * Count documents matching a query
   * @param index - Index name or pattern
   * @param query - Optional query to filter documents
   */
  async count(
    index: string,
    query?: object
  ): Promise<{ count: number; _shards: { total: number; successful: number; skipped: number; failed: number } }> {
    return this._request(`/${encodeURIComponent(index)}/_count`, {
      method: query ? 'POST' : 'GET',
      body: query,
    });
  }

  /**
   * Check if an index exists
   * @param index - Index name
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/${encodeURIComponent(index)}`, {
        method: 'HEAD',
        headers: this.config.auth
          ? { Authorization: this.getAuthHeader(this.config.auth) }
          : {},
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get field capabilities for an index
   * @param index - Index name or pattern
   */
  async getFieldCapabilities(
    index: string
  ): Promise<{
    fields: Record<
      string,
      Record<string, { type: string; searchable: boolean; aggregatable: boolean }>
    >;
  }> {
    return this._request(`/${encodeURIComponent(index)}/_field_caps?fields=*`);
  }
}
