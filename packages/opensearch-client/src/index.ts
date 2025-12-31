// Types
export type {
  ConnectionConfig,
  BasicAuth,
  ApiKeyAuth,
  AwsSigV4Auth,
  AuthConfig,
  IndexInfo,
  FieldMapping,
  IndexMapping,
  SearchResponse,
  SearchHit,
  ShardInfo,
  AggregationBucket,
  AggregationResult,
  ClusterHealth,
  OpenSearchError,
} from './types';

// Client
export { OpenSearchClient, OpenSearchClientError } from './client';

// Schema Parser
export {
  parseMapping,
  getFieldsByType,
  getSearchableFields,
  getAggregatableFields,
  getNestedPaths,
  buildFieldTree,
} from './schema-parser';

export type { FieldInfo, FieldNode } from './schema-parser';
