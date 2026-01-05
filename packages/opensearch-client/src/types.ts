/**
 * Authentication types for OpenSearch connection
 */
export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}

export interface ApiKeyAuth {
  type: 'apiKey';
  apiKey: string;
}

export interface AwsSigV4Auth {
  type: 'awsSigV4';
  region: string;
  service?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export type AuthConfig = BasicAuth | ApiKeyAuth | AwsSigV4Auth;

/**
 * Connection configuration for OpenSearch client
 */
export interface ConnectionConfig {
  /** Host URL (e.g., "https://localhost:9200") */
  host: string;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to verify SSL certificates */
  verifySsl?: boolean;
}

/**
 * Information about an OpenSearch index
 */
export interface IndexInfo {
  /** Index name */
  name: string;
  /** Index UUID */
  uuid: string;
  /** Health status (green, yellow, red) */
  health: 'green' | 'yellow' | 'red';
  /** Index status (open, close) */
  status: 'open' | 'close';
  /** Number of primary shards */
  primaryShards: number;
  /** Number of replica shards */
  replicaShards: number;
  /** Number of documents in the index */
  docsCount: number;
  /** Number of deleted documents */
  docsDeleted: number;
  /** Primary store size in bytes */
  storeSizeBytes: number;
  /** Primary store size as human-readable string */
  storeSize: string;
}

/**
 * Field mapping definition from OpenSearch
 */
export interface FieldMapping {
  /** Field data type */
  type?: string;
  /** Nested field mappings */
  properties?: Record<string, FieldMapping>;
  /** Field-level settings */
  fields?: Record<string, FieldMapping>;
  /** Whether the field is indexed */
  index?: boolean;
  /** Analyzer for text fields */
  analyzer?: string;
  /** Search analyzer for text fields */
  search_analyzer?: string;
  /** Format for date fields */
  format?: string;
  /** Whether to store the field separately */
  store?: boolean;
  /** Doc values setting */
  doc_values?: boolean;
  /** Null value replacement */
  null_value?: unknown;
  /** Copy to fields */
  copy_to?: string | string[];
  /** Enabled flag for object types */
  enabled?: boolean;
  /** Dynamic mapping setting */
  dynamic?: boolean | 'strict' | 'runtime';
}

/**
 * Complete index mapping structure
 */
export interface IndexMapping {
  /** Index name */
  index: string;
  /** Mapping properties */
  mappings: {
    properties?: Record<string, FieldMapping>;
    dynamic?: boolean | 'strict' | 'runtime';
    _source?: {
      enabled?: boolean;
      includes?: string[];
      excludes?: string[];
    };
    _meta?: Record<string, unknown>;
  };
}

/**
 * Shard information from search response
 */
export interface ShardInfo {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
}

/**
 * Individual search hit
 */
export interface SearchHit<T = Record<string, unknown>> {
  /** Index containing the document */
  _index: string;
  /** Document ID */
  _id: string;
  /** Relevance score */
  _score: number | null;
  /** Source document */
  _source: T;
  /** Matched fields from highlighting */
  highlight?: Record<string, string[]>;
  /** Sort values if sorting was applied */
  sort?: Array<string | number>;
  /** Inner hits for nested queries */
  inner_hits?: Record<string, { hits: { hits: SearchHit<T>[] } }>;
  /** Explanation of score calculation */
  _explanation?: {
    value: number;
    description: string;
    details: unknown[];
  };
}

/**
 * Aggregation bucket
 */
export interface AggregationBucket {
  key: string | number;
  key_as_string?: string;
  doc_count: number;
  [key: string]: unknown;
}

/**
 * Aggregation result structure
 */
export interface AggregationResult {
  buckets?: AggregationBucket[];
  value?: number;
  doc_count?: number;
  [key: string]: unknown;
}

/**
 * Suggester option in response
 */
export interface SuggesterOption {
  /** Suggested text */
  text: string;
  /** Suggestion score */
  score: number;
  /** Frequency of term */
  freq?: number;
  /** Highlighted suggestion (phrase suggester only) */
  highlighted?: string;
  /** Collation matches (phrase suggester only) */
  collate_match?: boolean;
}

/**
 * Suggester result entry
 */
export interface SuggesterResult {
  /** Original text */
  text: string;
  /** Offset in original text */
  offset: number;
  /** Length of text */
  length: number;
  /** Suggestion options */
  options: SuggesterOption[];
}

/**
 * Complete search response from OpenSearch
 */
export interface SearchResponse<T = Record<string, unknown>> {
  /** Time taken for the query in milliseconds */
  took: number;
  /** Whether the query timed out */
  timed_out: boolean;
  /** Shard information */
  _shards: ShardInfo;
  /** Search hits */
  hits: {
    /** Total hits information */
    total: {
      value: number;
      relation: 'eq' | 'gte';
    };
    /** Maximum score across all hits */
    max_score: number | null;
    /** Array of matching documents */
    hits: SearchHit<T>[];
  };
  /** Aggregation results */
  aggregations?: Record<string, AggregationResult>;
  /** Suggester results */
  suggest?: Record<string, SuggesterResult[]>;
  /** Scroll ID for pagination */
  _scroll_id?: string;
}

/**
 * Cluster health status
 */
export interface ClusterHealth {
  /** Cluster name */
  cluster_name: string;
  /** Health status */
  status: 'green' | 'yellow' | 'red';
  /** Whether the cluster timed out */
  timed_out: boolean;
  /** Number of nodes in the cluster */
  number_of_nodes: number;
  /** Number of data nodes */
  number_of_data_nodes: number;
  /** Number of active primary shards */
  active_primary_shards: number;
  /** Number of active shards */
  active_shards: number;
  /** Number of relocating shards */
  relocating_shards: number;
  /** Number of initializing shards */
  initializing_shards: number;
  /** Number of unassigned shards */
  unassigned_shards: number;
  /** Number of delayed unassigned shards */
  delayed_unassigned_shards: number;
  /** Number of pending tasks */
  number_of_pending_tasks: number;
  /** Number of in-flight fetch operations */
  number_of_in_flight_fetch: number;
  /** Task max waiting time in queue in milliseconds */
  task_max_waiting_in_queue_millis: number;
  /** Percentage of active shards */
  active_shards_percent_as_number: number;
}

/**
 * Error response from OpenSearch
 */
export interface OpenSearchError {
  error: {
    root_cause?: Array<{
      type: string;
      reason: string;
      index?: string;
    }>;
    type: string;
    reason: string;
    phase?: string;
    grouped?: boolean;
    failed_shards?: Array<{
      shard: number;
      index: string;
      node: string;
      reason: {
        type: string;
        reason: string;
      };
    }>;
  };
  status: number;
}
