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
  // Full-text queries
  | 'match'
  | 'match_phrase'
  | 'match_phrase_prefix'
  | 'multi_match'
  | 'query_string'
  | 'simple_query_string'
  // Term-level queries
  | 'term'
  | 'terms'
  | 'range'
  | 'prefix'
  | 'wildcard'
  | 'regexp'
  | 'fuzzy'
  | 'exists'
  | 'ids'
  // Compound queries
  | 'bool'
  | 'dis_max'
  | 'constant_score'
  | 'boosting'
  | 'function_score'
  // Joining queries
  | 'nested'
  // Geo queries
  | 'geo_bounding_box'
  | 'geo_distance'
  | 'geo_shape'
  // Special queries
  | 'match_all'
  | 'match_none';

/**
 * OpenSearch field data types
 */
export type FieldType =
  // Text types
  | 'text'
  | 'keyword'
  | 'completion'
  | 'search_as_you_type'
  | 'token_count'
  // Numeric types
  | 'long'
  | 'integer'
  | 'short'
  | 'byte'
  | 'double'
  | 'float'
  | 'half_float'
  | 'scaled_float'
  | 'unsigned_long'
  // Date types
  | 'date'
  | 'date_nanos'
  // Boolean
  | 'boolean'
  // Binary
  | 'binary'
  // IP address
  | 'ip'
  // Geo types
  | 'geo_point'
  | 'geo_shape'
  // Complex types
  | 'nested'
  | 'object'
  | 'flattened'
  | 'join'
  // Other types
  | 'percolator'
  | 'rank_feature'
  | 'rank_features'
  | 'dense_vector'
  | 'sparse_vector'
  | 'alias';

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
  /** Whether transpositions are allowed in fuzzy matching */
  fuzzy_transpositions?: boolean;
  /** Auto generate synonyms phrase query */
  auto_generate_synonyms_phrase_query?: boolean;
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
  /** Timezone for date parsing in query string */
  time_zone?: string;
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
 * Match phrase query node - exact phrase matching
 */
export interface MatchPhraseQueryNode extends FieldQueryNode {
  type: 'match_phrase';
  value: string;
  /** Slop for phrase matching (how many positions terms can be apart) */
  slop?: number;
  /** Analyzer to use */
  analyzer?: string;
  /** Zero terms query behavior */
  zero_terms_query?: 'none' | 'all';
}

/**
 * Match phrase prefix query node - phrase prefix matching for autocomplete
 */
export interface MatchPhrasePrefixQueryNode extends FieldQueryNode {
  type: 'match_phrase_prefix';
  value: string;
  /** Slop for phrase matching */
  slop?: number;
  /** Maximum expansions for the last term */
  max_expansions?: number;
  /** Analyzer to use */
  analyzer?: string;
  /** Zero terms query behavior */
  zero_terms_query?: 'none' | 'all';
}

/**
 * Terms lookup configuration for fetching terms from another document
 */
export interface TermsLookup {
  /** Index containing the document with terms */
  index: string;
  /** Document ID */
  id: string;
  /** Path to the field containing terms */
  path: string;
  /** Routing value for the lookup document */
  routing?: string;
}

/**
 * Terms query node - exact match for multiple values
 * Supports both inline values and terms lookup from another document
 */
export interface TermsQueryNode extends QueryNodeBase {
  type: 'terms';
  /** The field this query targets */
  field: string;
  /** Array of values to match (OR logic) - mutually exclusive with lookup */
  values?: (string | number | boolean)[];
  /** Terms lookup configuration - mutually exclusive with values */
  lookup?: TermsLookup;
}

/**
 * Match none query node - matches no documents
 */
export interface MatchNoneQueryNode extends QueryNodeBase {
  type: 'match_none';
}

/**
 * Regexp query node - regular expression matching
 */
export interface RegexpQueryNode extends FieldQueryNode {
  type: 'regexp';
  value: string;
  /** Flags for the regex (e.g., 'ALL', 'COMPLEMENT', etc.) */
  flags?: string;
  /** Case insensitive matching */
  case_insensitive?: boolean;
  /** Maximum determinized states for the automaton */
  max_determinized_states?: number;
  /** Rewrite method */
  rewrite?: string;
}

/**
 * Simple query string query node - simplified query syntax that never throws
 */
export interface SimpleQueryStringQueryNode extends QueryNodeBase {
  type: 'simple_query_string';
  /** The query string */
  query: string;
  /** Fields to search */
  fields?: string[];
  /** Default operator */
  default_operator?: 'AND' | 'OR';
  /** Analyzer to use */
  analyzer?: string;
  /** Flags to enable/disable features */
  flags?: string;
  /** Lenient parsing */
  lenient?: boolean;
  /** Minimum should match */
  minimum_should_match?: string | number;
  /** Analyze wildcard terms */
  analyze_wildcard?: boolean;
  /** Auto generate synonyms phrase query */
  auto_generate_synonyms_phrase_query?: boolean;
  /** Quote field suffix */
  quote_field_suffix?: string;
  /** Fuzzy prefix length */
  fuzzy_prefix_length?: number;
  /** Fuzzy max expansions */
  fuzzy_max_expansions?: number;
  /** Fuzzy transpositions */
  fuzzy_transpositions?: boolean;
}

/**
 * Dis max query node - returns documents matching any query, with tie breaking
 */
export interface DisMaxQueryNode extends QueryNodeBase {
  type: 'dis_max';
  /** Array of queries to match */
  queries: QueryNode[];
  /** Tie breaker multiplier (0-1) for scores of non-max matching queries */
  tie_breaker?: number;
}

/**
 * Constant score query node - wraps a filter and assigns constant score
 */
export interface ConstantScoreQueryNode extends QueryNodeBase {
  type: 'constant_score';
  /** The filter query (does not contribute to scoring) */
  filter: QueryNode;
}

/**
 * Boosting query node - demotes documents matching the negative query
 */
export interface BoostingQueryNode extends QueryNodeBase {
  type: 'boosting';
  /** Query for documents to boost positively */
  positive: QueryNode;
  /** Query for documents to demote */
  negative: QueryNode;
  /** Boost factor for negative matches (typically < 1) */
  negative_boost: number;
}

/**
 * Score function for function_score query
 */
export interface ScoreFunction {
  /** Optional filter to apply this function only to matching docs */
  filter?: QueryNode;
  /** Weight multiplier for this function */
  weight?: number;
  /** Script-based scoring */
  script_score?: {
    script: {
      source: string;
      params?: Record<string, unknown>;
    };
  };
  /** Random score */
  random_score?: {
    seed?: number | string;
    field?: string;
  };
  /** Field value factor */
  field_value_factor?: {
    field: string;
    factor?: number;
    modifier?: 'none' | 'log' | 'log1p' | 'log2p' | 'ln' | 'ln1p' | 'ln2p' | 'square' | 'sqrt' | 'reciprocal';
    missing?: number;
  };
  /** Decay functions */
  linear?: Record<string, DecayFunctionParams>;
  exp?: Record<string, DecayFunctionParams>;
  gauss?: Record<string, DecayFunctionParams>;
}

/**
 * Decay function parameters
 */
export interface DecayFunctionParams {
  origin: string | number;
  scale: string | number;
  offset?: string | number;
  decay?: number;
}

/**
 * Function score query node - modifies scores using functions
 */
export interface FunctionScoreQueryNode extends QueryNodeBase {
  type: 'function_score';
  /** Base query */
  query?: QueryNode;
  /** Score functions to apply */
  functions?: ScoreFunction[];
  /** How to combine function scores */
  score_mode?: 'multiply' | 'sum' | 'avg' | 'first' | 'max' | 'min';
  /** How to combine query and function scores */
  boost_mode?: 'multiply' | 'replace' | 'sum' | 'avg' | 'max' | 'min';
  /** Maximum boost value */
  max_boost?: number;
  /** Minimum score threshold */
  min_score?: number;
}

/**
 * Geo bounding box query node - matches geo points within a bounding box
 */
export interface GeoBoundingBoxQueryNode extends QueryNodeBase {
  type: 'geo_bounding_box';
  /** The geo_point field to query */
  field: string;
  /** Top-left corner */
  top_left: GeoPoint;
  /** Bottom-right corner */
  bottom_right: GeoPoint;
  /** Validation method */
  validation_method?: 'STRICT' | 'IGNORE_MALFORMED' | 'COERCE';
}

/**
 * Geo distance query node - matches geo points within a distance
 */
export interface GeoDistanceQueryNode extends QueryNodeBase {
  type: 'geo_distance';
  /** The geo_point field to query */
  field: string;
  /** Center point */
  location: GeoPoint;
  /** Distance (e.g., '10km', '5mi') */
  distance: string;
  /** Distance type calculation */
  distance_type?: 'arc' | 'plane';
  /** Validation method */
  validation_method?: 'STRICT' | 'IGNORE_MALFORMED' | 'COERCE';
}

/**
 * Geo shape query node - matches geo shapes
 */
export interface GeoShapeQueryNode extends QueryNodeBase {
  type: 'geo_shape';
  /** The geo_shape field to query */
  field: string;
  /** The shape to match against */
  shape?: GeoShape;
  /** Indexed shape reference */
  indexed_shape?: {
    index: string;
    id: string;
    path?: string;
  };
  /** Spatial relation */
  relation?: 'INTERSECTS' | 'DISJOINT' | 'WITHIN' | 'CONTAINS';
}

/**
 * Geo point representation
 */
export type GeoPoint =
  | { lat: number; lon: number }
  | [number, number]  // [lon, lat]
  | string;  // "lat,lon" or geohash

/**
 * Geo shape representation
 */
export interface GeoShape {
  type: 'point' | 'linestring' | 'polygon' | 'multipoint' | 'multilinestring' | 'multipolygon' | 'geometrycollection' | 'envelope' | 'circle';
  coordinates?: unknown;  // Coordinates depend on shape type
  radius?: string;  // For circle
  geometries?: GeoShape[];  // For geometrycollection
}

/**
 * Union type of all query node types
 */
export type QueryNode =
  // Full-text queries
  | MatchQueryNode
  | MatchPhraseQueryNode
  | MatchPhrasePrefixQueryNode
  | MultiMatchQueryNode
  | QueryStringQueryNode
  | SimpleQueryStringQueryNode
  // Term-level queries
  | TermQueryNode
  | TermsQueryNode
  | RangeQueryNode
  | PrefixQueryNode
  | WildcardQueryNode
  | RegexpQueryNode
  | FuzzyQueryNode
  | ExistsQueryNode
  | IdsQueryNode
  // Compound queries
  | BoolQueryNode
  | DisMaxQueryNode
  | ConstantScoreQueryNode
  | BoostingQueryNode
  | FunctionScoreQueryNode
  // Joining queries
  | NestedQueryNode
  // Geo queries
  | GeoBoundingBoxQueryNode
  | GeoDistanceQueryNode
  | GeoShapeQueryNode
  // Special queries
  | MatchAllQueryNode
  | MatchNoneQueryNode;

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
 * Term suggester configuration
 * Suggests corrections for individual words based on edit distance
 */
export interface TermSuggesterConfig {
  /** Field to use for suggestions */
  field: string;
  /** When to suggest: missing (default), popular, always */
  suggest_mode?: 'missing' | 'popular' | 'always';
  /** Minimum word length to suggest */
  min_word_length?: number;
  /** Prefix length that must match */
  prefix_length?: number;
  /** Maximum Levenshtein edit distance (1-2) */
  max_edits?: number;
  /** Maximum terms to inspect */
  max_inspections?: number;
  /** Maximum term frequency */
  max_term_freq?: number;
  /** Minimum document frequency */
  min_doc_freq?: number;
  /** Sort suggestions by score or frequency */
  sort?: 'score' | 'frequency';
}

/**
 * Direct generator for phrase suggester
 */
export interface DirectGenerator {
  /** Field to generate candidates from */
  field: string;
  /** When to suggest */
  suggest_mode?: 'missing' | 'popular' | 'always';
  /** Minimum word length */
  min_word_length?: number;
  /** Prefix length */
  prefix_length?: number;
  /** Max edit distance */
  max_edits?: number;
  /** Size of candidates to generate */
  size?: number;
}

/**
 * Phrase suggester configuration
 * Suggests corrections for entire phrases with context awareness
 */
export interface PhraseSuggesterConfig {
  /** Field to use for suggestions */
  field: string;
  /** Maximum errors allowed */
  max_errors?: number;
  /** Confidence threshold (0-1) */
  confidence?: number;
  /** Gram size for shingle generation */
  gram_size?: number;
  /** Real word error likelihood */
  real_word_error_likelihood?: number;
  /** Direct generators for candidate generation */
  direct_generator?: DirectGenerator[];
  /** Highlight pre/post tags */
  highlight?: {
    pre_tag?: string;
    post_tag?: string;
  };
  /** Collation check */
  collate?: {
    query: { source: string };
    params?: Record<string, unknown>;
    prune?: boolean;
  };
}

/**
 * Suggester configuration
 * Wraps term or phrase suggester with the text to check
 */
export interface SuggesterConfig {
  /** Text to get suggestions for */
  text: string;
  /** Term suggester config */
  term?: TermSuggesterConfig;
  /** Phrase suggester config */
  phrase?: PhraseSuggesterConfig;
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
  /** Suggester configuration for spell-check and suggestions */
  suggest?: Record<string, SuggesterConfig>;
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
  suggest?: Record<string, unknown>;
}

// =============================================================================
// Aggregation Types
// =============================================================================

/**
 * Supported aggregation types for field exploration
 */
export type AggregationType =
  | 'terms'
  | 'stats'
  | 'extended_stats'
  | 'date_histogram'
  | 'histogram'
  | 'range'
  | 'cardinality'
  | 'avg'
  | 'sum'
  | 'min'
  | 'max'
  | 'value_count';

/**
 * Base interface for all aggregation definitions
 */
export interface AggregationBase {
  /** Unique name for this aggregation */
  name: string;
  /** The type of aggregation */
  type: AggregationType;
  /** The field to aggregate on */
  field: string;
}

/**
 * Terms aggregation - bucket aggregation for categorical values
 */
export interface TermsAggregation extends AggregationBase {
  type: 'terms';
  /** Maximum number of buckets to return */
  size?: number;
  /** Bucket ordering */
  order?: { _count: 'asc' | 'desc' } | { _key: 'asc' | 'desc' };
  /** Minimum document count for a bucket */
  min_doc_count?: number;
  /** Include pattern for term filtering */
  include?: string | string[];
  /** Exclude pattern for term filtering */
  exclude?: string | string[];
  /** Missing value bucket */
  missing?: string;
}

/**
 * Stats aggregation - basic statistical metrics
 */
export interface StatsAggregation extends AggregationBase {
  type: 'stats';
  /** Missing value handling */
  missing?: number;
}

/**
 * Extended stats aggregation - comprehensive statistical metrics
 */
export interface ExtendedStatsAggregation extends AggregationBase {
  type: 'extended_stats';
  /** Missing value handling */
  missing?: number;
  /** Standard deviation bounds sigma */
  sigma?: number;
}

/**
 * Date histogram aggregation - time-based bucketing
 */
export interface DateHistogramAggregation extends AggregationBase {
  type: 'date_histogram';
  /** Calendar-based interval (e.g., '1M', '1w', '1d') */
  calendar_interval?: string;
  /** Fixed interval (e.g., '30m', '1h', '1d') */
  fixed_interval?: string;
  /** Date format for bucket keys */
  format?: string;
  /** Timezone for date calculations */
  time_zone?: string;
  /** Offset for interval calculation */
  offset?: string;
  /** Minimum document count for a bucket */
  min_doc_count?: number;
  /** Extended bounds for empty buckets */
  extended_bounds?: {
    min?: string | number;
    max?: string | number;
  };
  /** Missing value handling */
  missing?: string;
}

/**
 * Histogram aggregation - numeric interval bucketing
 */
export interface HistogramAggregation extends AggregationBase {
  type: 'histogram';
  /** Bucket interval */
  interval: number;
  /** Offset for bucket boundaries */
  offset?: number;
  /** Minimum document count for a bucket */
  min_doc_count?: number;
  /** Extended bounds for empty buckets */
  extended_bounds?: {
    min?: number;
    max?: number;
  };
  /** Missing value handling */
  missing?: number;
}

/**
 * Range aggregation - custom range bucketing
 */
export interface RangeAggregation extends AggregationBase {
  type: 'range';
  /** Range definitions */
  ranges: Array<{
    key?: string;
    from?: number;
    to?: number;
  }>;
  /** Whether ranges are keyed */
  keyed?: boolean;
}

/**
 * Cardinality aggregation - unique value count
 */
export interface CardinalityAggregation extends AggregationBase {
  type: 'cardinality';
  /** Precision threshold for approximate counting */
  precision_threshold?: number;
  /** Missing value handling */
  missing?: string;
}

/**
 * Single-value metric aggregations
 */
export interface AvgAggregation extends AggregationBase {
  type: 'avg';
  missing?: number;
}

export interface SumAggregation extends AggregationBase {
  type: 'sum';
  missing?: number;
}

export interface MinAggregation extends AggregationBase {
  type: 'min';
  missing?: number;
}

export interface MaxAggregation extends AggregationBase {
  type: 'max';
  missing?: number;
}

export interface ValueCountAggregation extends AggregationBase {
  type: 'value_count';
}

/**
 * Union of all aggregation types
 */
export type Aggregation =
  | TermsAggregation
  | StatsAggregation
  | ExtendedStatsAggregation
  | DateHistogramAggregation
  | HistogramAggregation
  | RangeAggregation
  | CardinalityAggregation
  | AvgAggregation
  | SumAggregation
  | MinAggregation
  | MaxAggregation
  | ValueCountAggregation;

// =============================================================================
// Aggregation Result Types
// =============================================================================

/**
 * Terms aggregation bucket result
 */
export interface TermsBucket {
  key: string | number;
  key_as_string?: string;
  doc_count: number;
}

/**
 * Terms aggregation result
 */
export interface TermsAggregationResult {
  doc_count_error_upper_bound: number;
  sum_other_doc_count: number;
  buckets: TermsBucket[];
}

/**
 * Stats aggregation result
 */
export interface StatsAggregationResult {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  sum: number;
}

/**
 * Extended stats aggregation result
 */
export interface ExtendedStatsAggregationResult extends StatsAggregationResult {
  sum_of_squares: number | null;
  variance: number | null;
  variance_population: number | null;
  variance_sampling: number | null;
  std_deviation: number | null;
  std_deviation_population: number | null;
  std_deviation_sampling: number | null;
  std_deviation_bounds: {
    upper: number | null;
    lower: number | null;
    upper_population: number | null;
    lower_population: number | null;
    upper_sampling: number | null;
    lower_sampling: number | null;
  };
}

/**
 * Date histogram bucket result
 */
export interface DateHistogramBucket {
  key: number;
  key_as_string: string;
  doc_count: number;
}

/**
 * Date histogram aggregation result
 */
export interface DateHistogramAggregationResult {
  buckets: DateHistogramBucket[];
}

/**
 * Histogram bucket result
 */
export interface HistogramBucket {
  key: number;
  doc_count: number;
}

/**
 * Histogram aggregation result
 */
export interface HistogramAggregationResult {
  buckets: HistogramBucket[];
}

/**
 * Range bucket result
 */
export interface RangeBucket {
  key?: string;
  from?: number;
  to?: number;
  doc_count: number;
}

/**
 * Range aggregation result
 */
export interface RangeAggregationResult {
  buckets: RangeBucket[] | Record<string, RangeBucket>;
}

/**
 * Cardinality aggregation result
 */
export interface CardinalityAggregationResult {
  value: number;
}

/**
 * Single value metric result
 */
export interface SingleValueAggregationResult {
  value: number | null;
  value_as_string?: string;
}

/**
 * Union of all aggregation result types
 */
export type AggregationResult =
  | TermsAggregationResult
  | StatsAggregationResult
  | ExtendedStatsAggregationResult
  | DateHistogramAggregationResult
  | HistogramAggregationResult
  | RangeAggregationResult
  | CardinalityAggregationResult
  | SingleValueAggregationResult;
