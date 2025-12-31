/**
 * OpenSearch Query DSL Serializer
 *
 * This module converts QueryNode structures to OpenSearch-compatible
 * JSON query DSL format.
 */

import type {
  QueryNode,
  QueryState,
  OpenSearchQuery,
  OpenSearchRequestBody,
  BoolQueryNode,
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
  NestedQueryNode,
  MatchAllQueryNode,
  MatchNoneQueryNode,
  MultiMatchQueryNode,
  QueryStringQueryNode,
  SimpleQueryStringQueryNode,
  FuzzyQueryNode,
  IdsQueryNode,
  SortClause,
  HighlightConfig,
  InnerHitsConfig,
} from './types';

// =============================================================================
// Query Node Serializers
// =============================================================================

/**
 * Serialize a match query node
 */
function serializeMatchQuery(node: MatchQueryNode): OpenSearchQuery {
  const matchBody: Record<string, unknown> = {
    query: node.value,
  };

  if (node.operator) matchBody.operator = node.operator;
  if (node.fuzziness !== undefined) matchBody.fuzziness = node.fuzziness;
  if (node.prefix_length !== undefined)
    matchBody.prefix_length = node.prefix_length;
  if (node.max_expansions !== undefined)
    matchBody.max_expansions = node.max_expansions;
  if (node.lenient !== undefined) matchBody.lenient = node.lenient;
  if (node.zero_terms_query) matchBody.zero_terms_query = node.zero_terms_query;
  if (node.analyzer) matchBody.analyzer = node.analyzer;
  if (node.minimum_should_match !== undefined)
    matchBody.minimum_should_match = node.minimum_should_match;
  if (node.fuzzy_transpositions !== undefined)
    matchBody.fuzzy_transpositions = node.fuzzy_transpositions;
  if (node.auto_generate_synonyms_phrase_query !== undefined)
    matchBody.auto_generate_synonyms_phrase_query =
      node.auto_generate_synonyms_phrase_query;
  if (node.boost !== undefined) matchBody.boost = node.boost;
  if (node._name) matchBody._name = node._name;

  return {
    match: {
      [node.field]: matchBody,
    },
  };
}

/**
 * Serialize a match_phrase query node
 */
function serializeMatchPhraseQuery(node: MatchPhraseQueryNode): OpenSearchQuery {
  const body: Record<string, unknown> = {
    query: node.value,
  };

  if (node.slop !== undefined) body.slop = node.slop;
  if (node.analyzer) body.analyzer = node.analyzer;
  if (node.zero_terms_query) body.zero_terms_query = node.zero_terms_query;
  if (node.boost !== undefined) body.boost = node.boost;
  if (node._name) body._name = node._name;

  return {
    match_phrase: {
      [node.field]: body,
    },
  };
}

/**
 * Serialize a match_phrase_prefix query node
 */
function serializeMatchPhrasePrefixQuery(
  node: MatchPhrasePrefixQueryNode
): OpenSearchQuery {
  const body: Record<string, unknown> = {
    query: node.value,
  };

  if (node.slop !== undefined) body.slop = node.slop;
  if (node.max_expansions !== undefined) body.max_expansions = node.max_expansions;
  if (node.analyzer) body.analyzer = node.analyzer;
  if (node.zero_terms_query) body.zero_terms_query = node.zero_terms_query;
  if (node.boost !== undefined) body.boost = node.boost;
  if (node._name) body._name = node._name;

  return {
    match_phrase_prefix: {
      [node.field]: body,
    },
  };
}

/**
 * Serialize a term query node
 */
function serializeTermQuery(node: TermQueryNode): OpenSearchQuery {
  const termBody: Record<string, unknown> = {
    value: node.value,
  };

  if (node.case_insensitive !== undefined)
    termBody.case_insensitive = node.case_insensitive;
  if (node.boost !== undefined) termBody.boost = node.boost;
  if (node._name) termBody._name = node._name;

  return {
    term: {
      [node.field]: termBody,
    },
  };
}

/**
 * Serialize a terms query node
 */
function serializeTermsQuery(node: TermsQueryNode): OpenSearchQuery {
  const result: OpenSearchQuery = {
    terms: {
      [node.field]: node.values,
    },
  };

  if (node.boost !== undefined) {
    (result.terms as Record<string, unknown>).boost = node.boost;
  }
  if (node._name) {
    (result.terms as Record<string, unknown>)._name = node._name;
  }

  return result;
}

/**
 * Serialize a range query node
 */
function serializeRangeQuery(node: RangeQueryNode): OpenSearchQuery {
  const rangeBody: Record<string, unknown> = {};

  if (node.gt !== undefined) rangeBody.gt = node.gt;
  if (node.gte !== undefined) rangeBody.gte = node.gte;
  if (node.lt !== undefined) rangeBody.lt = node.lt;
  if (node.lte !== undefined) rangeBody.lte = node.lte;
  if (node.format) rangeBody.format = node.format;
  if (node.time_zone) rangeBody.time_zone = node.time_zone;
  if (node.relation) rangeBody.relation = node.relation;
  if (node.boost !== undefined) rangeBody.boost = node.boost;
  if (node._name) rangeBody._name = node._name;

  return {
    range: {
      [node.field]: rangeBody,
    },
  };
}

/**
 * Serialize a prefix query node
 */
function serializePrefixQuery(node: PrefixQueryNode): OpenSearchQuery {
  const prefixBody: Record<string, unknown> = {
    value: node.value,
  };

  if (node.case_insensitive !== undefined)
    prefixBody.case_insensitive = node.case_insensitive;
  if (node.rewrite) prefixBody.rewrite = node.rewrite;
  if (node.boost !== undefined) prefixBody.boost = node.boost;
  if (node._name) prefixBody._name = node._name;

  return {
    prefix: {
      [node.field]: prefixBody,
    },
  };
}

/**
 * Serialize a wildcard query node
 */
function serializeWildcardQuery(node: WildcardQueryNode): OpenSearchQuery {
  const wildcardBody: Record<string, unknown> = {
    value: node.value,
  };

  if (node.case_insensitive !== undefined)
    wildcardBody.case_insensitive = node.case_insensitive;
  if (node.rewrite) wildcardBody.rewrite = node.rewrite;
  if (node.boost !== undefined) wildcardBody.boost = node.boost;
  if (node._name) wildcardBody._name = node._name;

  return {
    wildcard: {
      [node.field]: wildcardBody,
    },
  };
}

/**
 * Serialize a regexp query node
 */
function serializeRegexpQuery(node: RegexpQueryNode): OpenSearchQuery {
  const body: Record<string, unknown> = {
    value: node.value,
  };

  if (node.flags) body.flags = node.flags;
  if (node.case_insensitive !== undefined)
    body.case_insensitive = node.case_insensitive;
  if (node.max_determinized_states !== undefined)
    body.max_determinized_states = node.max_determinized_states;
  if (node.rewrite) body.rewrite = node.rewrite;
  if (node.boost !== undefined) body.boost = node.boost;
  if (node._name) body._name = node._name;

  return {
    regexp: {
      [node.field]: body,
    },
  };
}

/**
 * Serialize an exists query node
 */
function serializeExistsQuery(node: ExistsQueryNode): OpenSearchQuery {
  const query: OpenSearchQuery = {
    exists: {
      field: node.field,
    },
  };

  if (node.boost !== undefined) {
    (query.exists as Record<string, unknown>).boost = node.boost;
  }
  if (node._name) {
    (query.exists as Record<string, unknown>)._name = node._name;
  }

  return query;
}

/**
 * Serialize a bool query node
 */
function serializeBoolQuery(node: BoolQueryNode): OpenSearchQuery {
  const boolBody: Record<string, unknown> = {};

  if (node.must.length > 0) {
    boolBody.must = node.must.map((child) => serializeQuery(child));
  }
  if (node.should.length > 0) {
    boolBody.should = node.should.map((child) => serializeQuery(child));
  }
  if (node.must_not.length > 0) {
    boolBody.must_not = node.must_not.map((child) => serializeQuery(child));
  }
  if (node.filter.length > 0) {
    boolBody.filter = node.filter.map((child) => serializeQuery(child));
  }
  if (node.minimum_should_match !== undefined) {
    boolBody.minimum_should_match = node.minimum_should_match;
  }
  if (node.boost !== undefined) boolBody.boost = node.boost;
  if (node._name) boolBody._name = node._name;

  // If bool body is empty (no clauses), return match_all instead
  if (Object.keys(boolBody).length === 0) {
    return { match_all: {} };
  }

  return { bool: boolBody };
}

/**
 * Serialize inner hits configuration to OpenSearch format
 */
function serializeInnerHits(config: InnerHitsConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (config.name) result.name = config.name;
  if (config.from !== undefined) result.from = config.from;
  if (config.size !== undefined) result.size = config.size;
  if (config._source !== undefined) result._source = config._source;

  // Serialize sort clauses with nested filters properly
  if (config.sort && config.sort.length > 0) {
    result.sort = config.sort.map((clause) => serializeSortClause(clause));
  }

  if (config.highlight) result.highlight = serializeHighlight(config.highlight);

  return result;
}

/**
 * Serialize a nested query node
 */
function serializeNestedQuery(node: NestedQueryNode): OpenSearchQuery {
  const nestedBody: Record<string, unknown> = {
    path: node.path,
    query: serializeQuery(node.query),
  };

  if (node.score_mode) nestedBody.score_mode = node.score_mode;
  if (node.ignore_unmapped !== undefined)
    nestedBody.ignore_unmapped = node.ignore_unmapped;
  if (node.inner_hits) nestedBody.inner_hits = serializeInnerHits(node.inner_hits);
  if (node.boost !== undefined) nestedBody.boost = node.boost;
  if (node._name) nestedBody._name = node._name;

  return { nested: nestedBody };
}

/**
 * Serialize a match_all query node
 */
function serializeMatchAllQuery(node: MatchAllQueryNode): OpenSearchQuery {
  const matchAllBody: Record<string, unknown> = {};

  if (node.boost !== undefined) matchAllBody.boost = node.boost;
  if (node._name) matchAllBody._name = node._name;

  return { match_all: matchAllBody };
}

/**
 * Serialize a match_none query node
 */
function serializeMatchNoneQuery(node: MatchNoneQueryNode): OpenSearchQuery {
  const body: Record<string, unknown> = {};

  if (node.boost !== undefined) body.boost = node.boost;
  if (node._name) body._name = node._name;

  return { match_none: body };
}

/**
 * Serialize a multi_match query node
 */
function serializeMultiMatchQuery(node: MultiMatchQueryNode): OpenSearchQuery {
  const multiMatchBody: Record<string, unknown> = {
    query: node.query,
    fields: node.fields,
  };

  if (node.multi_match_type) multiMatchBody.type = node.multi_match_type;
  if (node.operator) multiMatchBody.operator = node.operator;
  if (node.fuzziness !== undefined) multiMatchBody.fuzziness = node.fuzziness;
  if (node.prefix_length !== undefined)
    multiMatchBody.prefix_length = node.prefix_length;
  if (node.max_expansions !== undefined)
    multiMatchBody.max_expansions = node.max_expansions;
  if (node.minimum_should_match !== undefined)
    multiMatchBody.minimum_should_match = node.minimum_should_match;
  if (node.tie_breaker !== undefined)
    multiMatchBody.tie_breaker = node.tie_breaker;
  if (node.analyzer) multiMatchBody.analyzer = node.analyzer;
  if (node.lenient !== undefined) multiMatchBody.lenient = node.lenient;
  if (node.zero_terms_query)
    multiMatchBody.zero_terms_query = node.zero_terms_query;
  if (node.boost !== undefined) multiMatchBody.boost = node.boost;
  if (node._name) multiMatchBody._name = node._name;

  return { multi_match: multiMatchBody };
}

/**
 * Serialize a query_string query node
 */
function serializeQueryStringQuery(
  node: QueryStringQueryNode
): OpenSearchQuery {
  const queryStringBody: Record<string, unknown> = {
    query: node.query,
  };

  if (node.default_field) queryStringBody.default_field = node.default_field;
  if (node.fields) queryStringBody.fields = node.fields;
  if (node.default_operator)
    queryStringBody.default_operator = node.default_operator;
  if (node.analyzer) queryStringBody.analyzer = node.analyzer;
  if (node.allow_leading_wildcard !== undefined)
    queryStringBody.allow_leading_wildcard = node.allow_leading_wildcard;
  if (node.enable_position_increments !== undefined)
    queryStringBody.enable_position_increments =
      node.enable_position_increments;
  if (node.fuzziness !== undefined)
    queryStringBody.fuzziness = node.fuzziness;
  if (node.fuzzy_prefix_length !== undefined)
    queryStringBody.fuzzy_prefix_length = node.fuzzy_prefix_length;
  if (node.fuzzy_max_expansions !== undefined)
    queryStringBody.fuzzy_max_expansions = node.fuzzy_max_expansions;
  if (node.phrase_slop !== undefined)
    queryStringBody.phrase_slop = node.phrase_slop;
  if (node.auto_generate_synonyms_phrase_query !== undefined)
    queryStringBody.auto_generate_synonyms_phrase_query =
      node.auto_generate_synonyms_phrase_query;
  if (node.lenient !== undefined) queryStringBody.lenient = node.lenient;
  if (node.minimum_should_match !== undefined)
    queryStringBody.minimum_should_match = node.minimum_should_match;
  if (node.time_zone) queryStringBody.time_zone = node.time_zone;
  if (node.boost !== undefined) queryStringBody.boost = node.boost;
  if (node._name) queryStringBody._name = node._name;

  return { query_string: queryStringBody };
}

/**
 * Serialize a simple_query_string query node
 */
function serializeSimpleQueryStringQuery(
  node: SimpleQueryStringQueryNode
): OpenSearchQuery {
  const body: Record<string, unknown> = {
    query: node.query,
  };

  if (node.fields) body.fields = node.fields;
  if (node.default_operator) body.default_operator = node.default_operator;
  if (node.analyzer) body.analyzer = node.analyzer;
  if (node.flags) body.flags = node.flags;
  if (node.lenient !== undefined) body.lenient = node.lenient;
  if (node.minimum_should_match !== undefined)
    body.minimum_should_match = node.minimum_should_match;
  if (node.analyze_wildcard !== undefined)
    body.analyze_wildcard = node.analyze_wildcard;
  if (node.auto_generate_synonyms_phrase_query !== undefined)
    body.auto_generate_synonyms_phrase_query =
      node.auto_generate_synonyms_phrase_query;
  if (node.quote_field_suffix) body.quote_field_suffix = node.quote_field_suffix;
  if (node.fuzzy_prefix_length !== undefined)
    body.fuzzy_prefix_length = node.fuzzy_prefix_length;
  if (node.fuzzy_max_expansions !== undefined)
    body.fuzzy_max_expansions = node.fuzzy_max_expansions;
  if (node.fuzzy_transpositions !== undefined)
    body.fuzzy_transpositions = node.fuzzy_transpositions;
  if (node.boost !== undefined) body.boost = node.boost;
  if (node._name) body._name = node._name;

  return { simple_query_string: body };
}

/**
 * Serialize a fuzzy query node
 */
function serializeFuzzyQuery(node: FuzzyQueryNode): OpenSearchQuery {
  const fuzzyBody: Record<string, unknown> = {
    value: node.value,
  };

  if (node.fuzziness !== undefined) fuzzyBody.fuzziness = node.fuzziness;
  if (node.prefix_length !== undefined)
    fuzzyBody.prefix_length = node.prefix_length;
  if (node.max_expansions !== undefined)
    fuzzyBody.max_expansions = node.max_expansions;
  if (node.transpositions !== undefined)
    fuzzyBody.transpositions = node.transpositions;
  if (node.rewrite) fuzzyBody.rewrite = node.rewrite;
  if (node.boost !== undefined) fuzzyBody.boost = node.boost;
  if (node._name) fuzzyBody._name = node._name;

  return {
    fuzzy: {
      [node.field]: fuzzyBody,
    },
  };
}

/**
 * Serialize an ids query node
 */
function serializeIdsQuery(node: IdsQueryNode): OpenSearchQuery {
  const idsBody: Record<string, unknown> = {
    values: node.values,
  };

  if (node.boost !== undefined) idsBody.boost = node.boost;
  if (node._name) idsBody._name = node._name;

  return { ids: idsBody };
}

// =============================================================================
// Main Serialization Functions
// =============================================================================

/**
 * Serialize a QueryNode to OpenSearch query DSL format
 *
 * @param node - The query node to serialize
 * @returns OpenSearch-compatible query JSON
 *
 * @example
 * ```typescript
 * const node: MatchQueryNode = {
 *   id: '1',
 *   type: 'match',
 *   field: 'title',
 *   value: 'hello world'
 * };
 *
 * const query = serializeQuery(node);
 * // { match: { title: { query: 'hello world' } } }
 * ```
 */
export function serializeQuery(node: QueryNode): OpenSearchQuery {
  switch (node.type) {
    case 'match':
      return serializeMatchQuery(node);
    case 'match_phrase':
      return serializeMatchPhraseQuery(node);
    case 'match_phrase_prefix':
      return serializeMatchPhrasePrefixQuery(node);
    case 'term':
      return serializeTermQuery(node);
    case 'terms':
      return serializeTermsQuery(node);
    case 'range':
      return serializeRangeQuery(node);
    case 'prefix':
      return serializePrefixQuery(node);
    case 'wildcard':
      return serializeWildcardQuery(node);
    case 'regexp':
      return serializeRegexpQuery(node);
    case 'exists':
      return serializeExistsQuery(node);
    case 'bool':
      return serializeBoolQuery(node);
    case 'nested':
      return serializeNestedQuery(node);
    case 'match_all':
      return serializeMatchAllQuery(node);
    case 'match_none':
      return serializeMatchNoneQuery(node);
    case 'multi_match':
      return serializeMultiMatchQuery(node);
    case 'query_string':
      return serializeQueryStringQuery(node);
    case 'simple_query_string':
      return serializeSimpleQueryStringQuery(node);
    case 'fuzzy':
      return serializeFuzzyQuery(node);
    case 'ids':
      return serializeIdsQuery(node);
    default:
      // Exhaustive check - this should never happen if all types are handled
      const _exhaustiveCheck: never = node;
      throw new Error(`Unknown query type: ${(_exhaustiveCheck as QueryNode).type}`);
  }
}

/**
 * Serialize a sort clause to OpenSearch format
 */
function serializeSortClause(
  clause: SortClause
): Record<string, unknown> | string {
  // Simple case: just field and order
  if (
    !clause.mode &&
    !clause.missing &&
    !clause.unmapped_type &&
    !clause.nested
  ) {
    return { [clause.field]: { order: clause.order } };
  }

  // Complex case: include additional options
  const sortBody: Record<string, unknown> = {
    order: clause.order,
  };

  if (clause.mode) sortBody.mode = clause.mode;
  if (clause.missing) sortBody.missing = clause.missing;
  if (clause.unmapped_type) sortBody.unmapped_type = clause.unmapped_type;
  if (clause.nested) {
    sortBody.nested = {
      path: clause.nested.path,
      ...(clause.nested.filter && {
        filter: serializeQuery(clause.nested.filter),
      }),
    };
  }

  return { [clause.field]: sortBody };
}

/**
 * Serialize highlight configuration to OpenSearch format
 */
function serializeHighlight(
  config: HighlightConfig
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    fields: config.fields,
  };

  if (config.pre_tags) result.pre_tags = config.pre_tags;
  if (config.post_tags) result.post_tags = config.post_tags;
  if (config.number_of_fragments !== undefined)
    result.number_of_fragments = config.number_of_fragments;
  if (config.fragment_size !== undefined)
    result.fragment_size = config.fragment_size;
  if (config.encoder) result.encoder = config.encoder;
  if (config.require_field_match !== undefined)
    result.require_field_match = config.require_field_match;
  if (config.type) result.type = config.type;
  if (config.order) result.order = config.order;

  return result;
}

/**
 * Serialize complete query state to OpenSearch request body
 *
 * @param state - The query state to serialize
 * @returns OpenSearch-compatible request body
 *
 * @example
 * ```typescript
 * const state: QueryState = {
 *   query: { id: '1', type: 'match_all' },
 *   size: 10,
 *   from: 0,
 *   sort: [{ field: 'date', order: 'desc' }]
 * };
 *
 * const body = serializeQueryState(state);
 * // { query: { match_all: {} }, size: 10, from: 0, sort: [{ date: { order: 'desc' } }] }
 * ```
 */
export function serializeQueryState(state: QueryState): OpenSearchRequestBody {
  const body: OpenSearchRequestBody = {};

  // Serialize query if present
  if (state.query) {
    body.query = serializeQuery(state.query);
  }

  // Pagination
  if (state.size !== undefined) body.size = state.size;
  if (state.from !== undefined) body.from = state.from;

  // Sorting
  if (state.sort && state.sort.length > 0) {
    body.sort = state.sort.map((clause) => serializeSortClause(clause));
  }

  // Other options
  if (state.timeout) body.timeout = state.timeout;
  if (state.explain !== undefined) body.explain = state.explain;
  if (state.highlight) body.highlight = serializeHighlight(state.highlight);
  if (state._source !== undefined) body._source = state._source;
  if (state.track_total_hits !== undefined)
    body.track_total_hits = state.track_total_hits;
  if (state.min_score !== undefined) body.min_score = state.min_score;
  if (state.search_after) body.search_after = state.search_after;
  if (state.aggs) body.aggs = state.aggs;

  return body;
}

/**
 * Convert query state to a formatted JSON string
 *
 * @param state - The query state to convert
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string representation
 */
export function serializeToJson(
  state: QueryState,
  pretty: boolean = true
): string {
  const body = serializeQueryState(state);
  return pretty ? JSON.stringify(body, null, 2) : JSON.stringify(body);
}
