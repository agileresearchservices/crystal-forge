/**
 * OpenSearch Query DSL Type Definitions
 *
 * This module provides comprehensive TypeScript types for building and
 * manipulating OpenSearch queries in a type-safe manner.
 */

// =============================================================================
// Core Type Unions
// =============================================================================

/**
 * All supported OpenSearch query types
 */
export type QueryType =
  | 'match'
  | 'term'
  | 'bool'
  | 'range'
  | 'prefix'
  | 'wildcard'
  | 'exists'
  | 'nested'
  | 'match_all'
  | 'multi_match'
  | 'query_string'
  | 'fuzzy'
  | 'ids';

/**
 * OpenSearch field data types
 */
export type FieldType =
  | 'text'
  | 'keyword'
  | 'long'
  | 'integer'
  | 'short'
  | 'byte'
  | 'double'
  | 'float'
  | 'date'
  | 'boolean'
  | 'geo_point'
  | 'nested'
  | 'object';

/**
 * Comparison operators for range queries
 */
export type RangeOperator = 'gt' | 'gte' | 'lt' | 'lte';

/**
 * Multi-match query types
 */
export type MultiMatchType =
  | 'best_fields'
  | 'most_fields'
  | 'cross_fields'
  | 'phrase'
  | 'phrase_prefix'
  | 'bool_prefix';

/**
 * Sort order directions
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort modes for array/multi-valued fields
 */
export type SortMode = 'min' | 'max' | 'sum' | 'avg' | 'median';

// =============================================================================
// Query Node Interfaces
// =============================================================================

/**
 * Base interface for all query nodes
 */
export interface QueryNodeBase {
  /** Unique identifier for this query node */
  id: string;
  /** The type of query */
  type: QueryType;
  /** Optional boost factor for scoring */
  boost?: number;
  /** Optional name for the query (for debugging) */
  _name?: string;
}

/**
 * Query node with a field target
 */
export interface FieldQueryNode extends QueryNodeBase {
  /** The field this query targets */
  field: string;
  /** The value to search for */
  value: unknown;
}

/**
 * Match query node - full-text search with analysis
 */
export interface MatchQueryNode extends FieldQueryNode {
  type: 'match';
  value: string;
  /** The operator for combining terms (and/or) */
  operator?: 'and' | 'or';
  /** Fuzziness level for typo tolerance */
  fuzziness?: string | number;
  /** Prefix length for fuzzy matching */
  prefix_length?: number;
  /** Maximum expansions for fuzzy matching */
  max_expansions?: number;
  /** Enable lenient parsing */
  lenient?: boolean;
  /** Zero terms query behavior */
  zero_terms_query?: 'none' | 'all';
  /** Analyzer to use */
  analyzer?: string;
  /** Minimum should match */
  minimum_should_match?: string | number;
}

/**
 * Term query node - exact value matching (not analyzed)
 */
export interface TermQueryNode extends FieldQueryNode {
  type: 'term';
  value: string | number | boolean;
  /** Case insensitive matching */
  case_insensitive?: boolean;
}

/**
 * Range query node - numeric/date range matching
 */
export interface RangeQueryNode extends QueryNodeBase {
  type: 'range';
  field: string;
  /** Greater than */
  gt?: string | number;
  /** Greater than or equal */
  gte?: string | number;
  /** Less than */
  lt?: string | number;
  /** Less than or equal */
  lte?: string | number;
  /** Format for date parsing */
  format?: string;
  /** Timezone for date parsing */
  time_zone?: string;
  /** Relation for date range queries */
  relation?: 'INTERSECTS' | 'CONTAINS' | 'WITHIN';
}

/**
 * Prefix query node - prefix matching on keyword fields
 */
export interface PrefixQueryNode extends FieldQueryNode {
  type: 'prefix';
  value: string;
  /** Case insensitive matching */
  case_insensitive?: boolean;
  /** Rewrite method */
  rewrite?: string;
}

/**
 * Wildcard query node - pattern matching with * and ?
 */
export interface WildcardQueryNode extends FieldQueryNode {
  type: 'wildcard';
  value: string;
  /** Case insensitive matching */
  case_insensitive?: boolean;
  /** Rewrite method */
  rewrite?: string;
}

/**
 * Exists query node - check if field exists
 */
export interface ExistsQueryNode extends QueryNodeBase {
  type: 'exists';
  field: string;
}

/**
 * Bool query node - compound boolean query
 */
export interface BoolQueryNode extends QueryNodeBase {
  type: 'bool';
  /** All clauses must match */
  must: QueryNode[];
  /** At least one clause should match */
  should: QueryNode[];
  /** No clause must match */
  must_not: QueryNode[];
  /** Clauses that must match but don't contribute to score */
  filter: QueryNode[];
  /** Minimum number of should clauses that must match */
  minimum_should_match?: number | string;
}

/**
 * Nested query node - query nested objects
 */
export interface NestedQueryNode extends QueryNodeBase {
  type: 'nested';
  /** Path to nested field */
  path: string;
  /** The query to run on nested documents */
  query: QueryNode;
  /** Score mode for nested hits */
  score_mode?: 'avg' | 'max' | 'min' | 'none' | 'sum';
  /** Whether to ignore unmapped nested fields */
  ignore_unmapped?: boolean;
  /** Inner hits configuration */
  inner_hits?: InnerHitsConfig;
}

/**
 * Match all query node - matches all documents
 */
export interface MatchAllQueryNode extends QueryNodeBase {
  type: 'match_all';
}

/**
 * Multi-match query node - search across multiple fields
 */
export interface MultiMatchQueryNode extends QueryNodeBase {
  type: 'multi_match';
  /** The query string */
  query: string;
  /** Fields to search (with optional boosts like "title^2") */
  fields: string[];
  /** How to combine field scores */
  multi_match_type?: MultiMatchType;
  /** Operator for combining terms */
  operator?: 'and' | 'or';
  /** Fuzziness level */
  fuzziness?: string | number;
  /** Prefix length for fuzzy matching */
  prefix_length?: number;
  /** Maximum expansions */
  max_expansions?: number;
  /** Minimum should match */
  minimum_should_match?: string | number;
  /** Tie breaker for best_fields */
  tie_breaker?: number;
  /** Analyzer to use */
  analyzer?: string;
  /** Enable lenient parsing */
  lenient?: boolean;
  /** Zero terms query behavior */
  zero_terms_query?: 'none' | 'all';
}

/**
 * Query string query node - Lucene query syntax
 */
export interface QueryStringQueryNode extends QueryNodeBase {
  type: 'query_string';
  /** The query string in Lucene syntax */
  query: string;
  /** Default field to search */
  default_field?: string;
  /** Fields to search */
  fields?: string[];
  /** Default operator */
  default_operator?: 'AND' | 'OR';
  /** Analyzer to use */
  analyzer?: string;
  /** Allow leading wildcard */
  allow_leading_wildcard?: boolean;
  /** Enable position increments */
  enable_position_increments?: boolean;
  /** Fuzziness level */
  fuzziness?: string | number;
  /** Fuzzy prefix length */
  fuzzy_prefix_length?: number;
  /** Fuzzy max expansions */
  fuzzy_max_expansions?: number;
  /** Phrase slop */
  phrase_slop?: number;
  /** Boost */
  boost?: number;
  /** Auto generate phrase queries */
  auto_generate_synonyms_phrase_query?: boolean;
  /** Lenient parsing */
  lenient?: boolean;
  /** Minimum should match */
  minimum_should_match?: string | number;
}

/**
 * Fuzzy query node - fuzzy term matching
 */
export interface FuzzyQueryNode extends FieldQueryNode {
  type: 'fuzzy';
  value: string;
  /** Fuzziness level (AUTO, 0, 1, 2) */
  fuzziness?: string | number;
  /** Prefix length */
  prefix_length?: number;
  /** Maximum expansions */
  max_expansions?: number;
  /** Transpositions allowed */
  transpositions?: boolean;
  /** Rewrite method */
  rewrite?: string;
}

/**
 * IDs query node - match by document IDs
 */
export interface IdsQueryNode extends QueryNodeBase {
  type: 'ids';
  /** Document IDs to match */
  values: string[];
}

/**
 * Union type of all query node types
 */
export type QueryNode =
  | MatchQueryNode
  | TermQueryNode
  | RangeQueryNode
  | PrefixQueryNode
  | WildcardQueryNode
  | ExistsQueryNode
  | BoolQueryNode
  | NestedQueryNode
  | MatchAllQueryNode
  | MultiMatchQueryNode
  | QueryStringQueryNode
  | FuzzyQueryNode
  | IdsQueryNode;

// =============================================================================
// Query State Interfaces
// =============================================================================

/**
 * Sort clause configuration
 */
export interface SortClause {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  order: SortOrder;
  /** Sort mode for multi-valued fields */
  mode?: SortMode;
  /** How to handle missing values */
  missing?: '_first' | '_last' | string;
  /** Unmapped type for sorting */
  unmapped_type?: string;
  /** Nested sort configuration */
  nested?: {
    path: string;
    filter?: QueryNode;
  };
}

/**
 * Highlight field configuration
 */
export interface HighlightFieldConfig {
  /** Number of fragments */
  number_of_fragments?: number;
  /** Fragment size */
  fragment_size?: number;
  /** Pre-highlight tag */
  pre_tags?: string[];
  /** Post-highlight tag */
  post_tags?: string[];
  /** Highlighter type */
  type?: 'unified' | 'plain' | 'fvh';
  /** Fragmenter type */
  fragmenter?: 'simple' | 'span';
  /** Require field match */
  require_field_match?: boolean;
  /** Max analyzed offset */
  max_analyzed_offset?: number;
}

/**
 * Highlight configuration
 */
export interface HighlightConfig {
  /** Fields to highlight */
  fields: Record<string, HighlightFieldConfig>;
  /** Global pre-highlight tags */
  pre_tags?: string[];
  /** Global post-highlight tags */
  post_tags?: string[];
  /** Number of fragments */
  number_of_fragments?: number;
  /** Fragment size */
  fragment_size?: number;
  /** Encoder */
  encoder?: 'default' | 'html';
  /** Require field match */
  require_field_match?: boolean;
  /** Highlighter type */
  type?: 'unified' | 'plain' | 'fvh';
  /** Order by score */
  order?: 'score';
}

/**
 * Inner hits configuration for nested queries
 */
export interface InnerHitsConfig {
  /** Name for the inner hits */
  name?: string;
  /** Offset */
  from?: number;
  /** Number of inner hits to return */
  size?: number;
  /** Sort configuration */
  sort?: SortClause[];
  /** Source filtering */
  _source?: boolean | string[] | { includes?: string[]; excludes?: string[] };
  /** Highlight configuration */
  highlight?: HighlightConfig;
}

/**
 * Source filtering configuration
 */
export type SourceFilter =
  | boolean
  | string[]
  | { includes?: string[]; excludes?: string[] };

/**
 * Complete query state for building OpenSearch requests
 */
export interface QueryState {
  /** The root query */
  query: QueryNode | null;
  /** Number of results to return */
  size?: number;
  /** Offset for pagination */
  from?: number;
  /** Sort configuration */
  sort?: SortClause[];
  /** Query timeout */
  timeout?: string;
  /** Include score explanation */
  explain?: boolean;
  /** Highlight configuration */
  highlight?: HighlightConfig;
  /** Source filtering */
  _source?: SourceFilter;
  /** Track total hits exactly */
  track_total_hits?: boolean | number;
  /** Minimum score threshold */
  min_score?: number;
  /** Search after for deep pagination */
  search_after?: (string | number)[];
  /** Aggregations (placeholder for future implementation) */
  aggs?: Record<string, unknown>;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation error for query nodes
 */
export interface QueryValidationError {
  /** Path to the error in the query tree */
  path: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'error' | 'warning';
  /** The node that caused the error */
  nodeId?: string;
}

/**
 * Validation result
 */
export interface QueryValidationResult {
  /** Whether the query is valid */
  valid: boolean;
  /** List of validation errors */
  errors: QueryValidationError[];
  /** List of validation warnings */
  warnings: QueryValidationError[];
}

// =============================================================================
// OpenSearch DSL Types (for serialization/deserialization)
// =============================================================================

/**
 * OpenSearch query DSL format (JSON representation)
 */
export type OpenSearchQuery = Record<string, unknown>;

/**
 * OpenSearch request body
 */
export interface OpenSearchRequestBody {
  query?: OpenSearchQuery;
  size?: number;
  from?: number;
  sort?: Array<Record<string, unknown> | string>;
  timeout?: string;
  explain?: boolean;
  highlight?: Record<string, unknown>;
  _source?: SourceFilter;
  track_total_hits?: boolean | number;
  min_score?: number;
  search_after?: (string | number)[];
  aggs?: Record<string, unknown>;
}
