/**
 * @crystal-forge/query-dsl
 *
 * OpenSearch Query DSL type definitions and utilities for the Crystal Forge
 * query builder. This package provides:
 *
 * - Complete TypeScript types for OpenSearch queries
 * - Serialization from QueryNode to OpenSearch JSON
 * - Deserialization from OpenSearch JSON to QueryNode
 * - Operator mappings for field types
 *
 * @packageDocumentation
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core type unions
  QueryType,
  FieldType,
  RangeOperator,
  MultiMatchType,
  SortOrder,
  SortMode,

  // Base interfaces
  QueryNodeBase,
  FieldQueryNode,

  // Query node types
  MatchQueryNode,
  MatchPhraseQueryNode,
  MatchPhrasePrefixQueryNode,
  TermQueryNode,
  TermsQueryNode,
  RangeQueryNode,
  PrefixQueryNode,
  WildcardQueryNode,
  RegexpQueryNode,
  ExistsQueryNode,
  BoolQueryNode,
  NestedQueryNode,
  MatchAllQueryNode,
  MatchNoneQueryNode,
  MultiMatchQueryNode,
  QueryStringQueryNode,
  SimpleQueryStringQueryNode,
  FuzzyQueryNode,
  IdsQueryNode,
  QueryNode,

  // Query state types
  SortClause,
  HighlightFieldConfig,
  HighlightConfig,
  InnerHitsConfig,
  SourceFilter,
  QueryState,

  // Validation types
  QueryValidationError,
  QueryValidationResult,

  // OpenSearch DSL types
  OpenSearchQuery,
  OpenSearchRequestBody,

  // Aggregation types
  AggregationType,
  AggregationBase,
  TermsAggregation,
  StatsAggregation,
  ExtendedStatsAggregation,
  DateHistogramAggregation,
  HistogramAggregation,
  RangeAggregation,
  CardinalityAggregation,
  AvgAggregation,
  SumAggregation,
  MinAggregation,
  MaxAggregation,
  ValueCountAggregation,
  Aggregation,

  // Aggregation result types
  TermsBucket,
  TermsAggregationResult,
  StatsAggregationResult,
  ExtendedStatsAggregationResult,
  DateHistogramBucket,
  DateHistogramAggregationResult,
  HistogramBucket,
  HistogramAggregationResult,
  RangeBucket,
  RangeAggregationResult,
  CardinalityAggregationResult,
  SingleValueAggregationResult,
  AggregationResult,
} from './types';

// =============================================================================
// Operator Exports
// =============================================================================

export type { OperatorDefinition } from './operators';

export {
  FIELD_TYPE_OPERATORS,
  getOperatorsForFieldType,
  getOperatorsByQueryType,
  isQueryTypeValidForField,
  getDefaultOperator,
} from './operators';

// =============================================================================
// Serializer Exports
// =============================================================================

export {
  serializeQuery,
  serializeQueryState,
  serializeToJson,
  serializeAggregation,
  serializeAggregations,
} from './serializer';

// =============================================================================
// Deserializer Exports
// =============================================================================

export {
  generateNodeId,
  resetNodeIdCounter,
  deserializeQuery,
  deserializeQueryState,
  deserializeFromJson,
} from './deserializer';
