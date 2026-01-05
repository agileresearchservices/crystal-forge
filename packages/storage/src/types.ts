import type { QueryState, Aggregation } from '@crystal-forge/query-dsl';

/**
 * Query template stored in IndexedDB
 */
export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'common' | 'ecommerce' | 'advanced' | 'custom';
  tags: string[];
  query: QueryState;
  aggs?: Aggregation[];
  isBuiltIn: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Query history entry
 */
export interface QueryHistoryEntry {
  id: string;
  query: QueryState;
  index_name: string;
  result_count: number;
  timestamp: Date;
}

/**
 * Aggregation template stored in IndexedDB
 */
export interface AggregationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  agg_type: string;
  config: Aggregation;
  isBuiltIn: boolean;
  created_at: Date;
}

/**
 * Database initialization result
 */
export interface DBInitResult {
  success: boolean;
  db: IDBDatabase | null;
  error: string | null;
}

/**
 * Storage service configuration
 */
export interface StorageConfig {
  dbName: string;
  version: number;
  stores: {
    templates: {
      keyPath: string;
      indexes: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
      }>;
    };
    history: {
      keyPath: string;
      indexes: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
      }>;
    };
    aggregations: {
      keyPath: string;
      indexes: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
      }>;
    };
  };
}
