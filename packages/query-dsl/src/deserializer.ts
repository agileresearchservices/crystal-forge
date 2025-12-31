/**
 * OpenSearch Query DSL Deserializer
 *
 * This module converts OpenSearch JSON query DSL format to QueryNode
 * structures for manipulation in the query builder.
 */

import type {
  QueryNode,
  QueryState,
  OpenSearchQuery,
  OpenSearchRequestBody,
  BoolQueryNode,
  MatchQueryNode,
  TermQueryNode,
  RangeQueryNode,
  PrefixQueryNode,
  WildcardQueryNode,
  ExistsQueryNode,
  NestedQueryNode,
  MatchAllQueryNode,
  MultiMatchQueryNode,
  QueryStringQueryNode,
  FuzzyQueryNode,
  IdsQueryNode,
  SortClause,
  HighlightConfig,
  HighlightFieldConfig,
  SortOrder,
  SortMode,
} from './types';

// =============================================================================
// ID Generation
// =============================================================================

let nodeIdCounter = 0;

/**
 * Generate a unique ID for a query node
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique string identifier
 *
 * @example
 * ```typescript
 * const id = generateNodeId(); // 'node_1'
 * const id2 = generateNodeId('match'); // 'match_2'
 * ```
 */
export function generateNodeId(prefix: string = 'node'): string {
  nodeIdCounter += 1;
  return `${prefix}_${nodeIdCounter}`;
}

/**
 * Reset the node ID counter (useful for testing)
 */
export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

// =============================================================================
// Query Deserializers
// =============================================================================

/**
 * Deserialize a match query
 */
function deserializeMatchQuery(
  field: string,
  body: unknown
): MatchQueryNode {
  const node: MatchQueryNode = {
    id: generateNodeId('match'),
    type: 'match',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const matchBody = body as Record<string, unknown>;
    node.value = String(matchBody.query ?? '');

    if (matchBody.operator) node.operator = matchBody.operator as 'and' | 'or';
    if (matchBody.fuzziness !== undefined)
      node.fuzziness = matchBody.fuzziness as string | number;
    if (matchBody.prefix_length !== undefined)
      node.prefix_length = matchBody.prefix_length as number;
    if (matchBody.max_expansions !== undefined)
      node.max_expansions = matchBody.max_expansions as number;
    if (matchBody.lenient !== undefined)
      node.lenient = matchBody.lenient as boolean;
    if (matchBody.zero_terms_query)
      node.zero_terms_query = matchBody.zero_terms_query as 'none' | 'all';
    if (matchBody.analyzer) node.analyzer = matchBody.analyzer as string;
    if (matchBody.minimum_should_match !== undefined)
      node.minimum_should_match = matchBody.minimum_should_match as
        | string
        | number;
    if (matchBody.boost !== undefined) node.boost = matchBody.boost as number;
    if (matchBody._name) node._name = matchBody._name as string;
  }

  return node;
}

/**
 * Deserialize a term query
 */
function deserializeTermQuery(
  field: string,
  body: unknown
): TermQueryNode {
  const node: TermQueryNode = {
    id: generateNodeId('term'),
    type: 'term',
    field,
    value: '',
  };

  if (typeof body === 'string' || typeof body === 'number' || typeof body === 'boolean') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const termBody = body as Record<string, unknown>;
    node.value = termBody.value as string | number | boolean;

    if (termBody.case_insensitive !== undefined)
      node.case_insensitive = termBody.case_insensitive as boolean;
    if (termBody.boost !== undefined) node.boost = termBody.boost as number;
    if (termBody._name) node._name = termBody._name as string;
  }

  return node;
}

/**
 * Deserialize a range query
 */
function deserializeRangeQuery(
  field: string,
  body: Record<string, unknown>
): RangeQueryNode {
  const node: RangeQueryNode = {
    id: generateNodeId('range'),
    type: 'range',
    field,
  };

  if (body.gt !== undefined) node.gt = body.gt as string | number;
  if (body.gte !== undefined) node.gte = body.gte as string | number;
  if (body.lt !== undefined) node.lt = body.lt as string | number;
  if (body.lte !== undefined) node.lte = body.lte as string | number;
  if (body.format) node.format = body.format as string;
  if (body.time_zone) node.time_zone = body.time_zone as string;
  if (body.relation)
    node.relation = body.relation as 'INTERSECTS' | 'CONTAINS' | 'WITHIN';
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a prefix query
 */
function deserializePrefixQuery(
  field: string,
  body: unknown
): PrefixQueryNode {
  const node: PrefixQueryNode = {
    id: generateNodeId('prefix'),
    type: 'prefix',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const prefixBody = body as Record<string, unknown>;
    node.value = String(prefixBody.value ?? '');

    if (prefixBody.case_insensitive !== undefined)
      node.case_insensitive = prefixBody.case_insensitive as boolean;
    if (prefixBody.rewrite) node.rewrite = prefixBody.rewrite as string;
    if (prefixBody.boost !== undefined)
      node.boost = prefixBody.boost as number;
    if (prefixBody._name) node._name = prefixBody._name as string;
  }

  return node;
}

/**
 * Deserialize a wildcard query
 */
function deserializeWildcardQuery(
  field: string,
  body: unknown
): WildcardQueryNode {
  const node: WildcardQueryNode = {
    id: generateNodeId('wildcard'),
    type: 'wildcard',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const wildcardBody = body as Record<string, unknown>;
    node.value = String(wildcardBody.value ?? '');

    if (wildcardBody.case_insensitive !== undefined)
      node.case_insensitive = wildcardBody.case_insensitive as boolean;
    if (wildcardBody.rewrite) node.rewrite = wildcardBody.rewrite as string;
    if (wildcardBody.boost !== undefined)
      node.boost = wildcardBody.boost as number;
    if (wildcardBody._name) node._name = wildcardBody._name as string;
  }

  return node;
}

/**
 * Deserialize an exists query
 */
function deserializeExistsQuery(
  body: Record<string, unknown>
): ExistsQueryNode {
  const node: ExistsQueryNode = {
    id: generateNodeId('exists'),
    type: 'exists',
    field: body.field as string,
  };

  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a bool query
 */
function deserializeBoolQuery(
  body: Record<string, unknown>
): BoolQueryNode {
  const node: BoolQueryNode = {
    id: generateNodeId('bool'),
    type: 'bool',
    must: [],
    should: [],
    must_not: [],
    filter: [],
  };

  if (Array.isArray(body.must)) {
    node.must = body.must.map((q) => deserializeQuery(q as OpenSearchQuery));
  } else if (body.must) {
    node.must = [deserializeQuery(body.must as OpenSearchQuery)];
  }

  if (Array.isArray(body.should)) {
    node.should = body.should.map((q) => deserializeQuery(q as OpenSearchQuery));
  } else if (body.should) {
    node.should = [deserializeQuery(body.should as OpenSearchQuery)];
  }

  if (Array.isArray(body.must_not)) {
    node.must_not = body.must_not.map((q) =>
      deserializeQuery(q as OpenSearchQuery)
    );
  } else if (body.must_not) {
    node.must_not = [deserializeQuery(body.must_not as OpenSearchQuery)];
  }

  if (Array.isArray(body.filter)) {
    node.filter = body.filter.map((q) => deserializeQuery(q as OpenSearchQuery));
  } else if (body.filter) {
    node.filter = [deserializeQuery(body.filter as OpenSearchQuery)];
  }

  if (body.minimum_should_match !== undefined)
    node.minimum_should_match = body.minimum_should_match as number | string;
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a nested query
 */
function deserializeNestedQuery(
  body: Record<string, unknown>
): NestedQueryNode {
  const node: NestedQueryNode = {
    id: generateNodeId('nested'),
    type: 'nested',
    path: body.path as string,
    query: deserializeQuery(body.query as OpenSearchQuery),
  };

  if (body.score_mode)
    node.score_mode = body.score_mode as 'avg' | 'max' | 'min' | 'none' | 'sum';
  if (body.ignore_unmapped !== undefined)
    node.ignore_unmapped = body.ignore_unmapped as boolean;
  if (body.inner_hits) node.inner_hits = body.inner_hits as NestedQueryNode['inner_hits'];
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a match_all query
 */
function deserializeMatchAllQuery(
  body: Record<string, unknown>
): MatchAllQueryNode {
  const node: MatchAllQueryNode = {
    id: generateNodeId('match_all'),
    type: 'match_all',
  };

  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a multi_match query
 */
function deserializeMultiMatchQuery(
  body: Record<string, unknown>
): MultiMatchQueryNode {
  const node: MultiMatchQueryNode = {
    id: generateNodeId('multi_match'),
    type: 'multi_match',
    query: body.query as string,
    fields: body.fields as string[],
  };

  if (body.type) node.multi_match_type = body.type as MultiMatchQueryNode['multi_match_type'];
  if (body.operator) node.operator = body.operator as 'and' | 'or';
  if (body.fuzziness !== undefined)
    node.fuzziness = body.fuzziness as string | number;
  if (body.prefix_length !== undefined)
    node.prefix_length = body.prefix_length as number;
  if (body.max_expansions !== undefined)
    node.max_expansions = body.max_expansions as number;
  if (body.minimum_should_match !== undefined)
    node.minimum_should_match = body.minimum_should_match as string | number;
  if (body.tie_breaker !== undefined)
    node.tie_breaker = body.tie_breaker as number;
  if (body.analyzer) node.analyzer = body.analyzer as string;
  if (body.lenient !== undefined) node.lenient = body.lenient as boolean;
  if (body.zero_terms_query)
    node.zero_terms_query = body.zero_terms_query as 'none' | 'all';
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a query_string query
 */
function deserializeQueryStringQuery(
  body: Record<string, unknown>
): QueryStringQueryNode {
  const node: QueryStringQueryNode = {
    id: generateNodeId('query_string'),
    type: 'query_string',
    query: body.query as string,
  };

  if (body.default_field) node.default_field = body.default_field as string;
  if (body.fields) node.fields = body.fields as string[];
  if (body.default_operator)
    node.default_operator = body.default_operator as 'AND' | 'OR';
  if (body.analyzer) node.analyzer = body.analyzer as string;
  if (body.allow_leading_wildcard !== undefined)
    node.allow_leading_wildcard = body.allow_leading_wildcard as boolean;
  if (body.enable_position_increments !== undefined)
    node.enable_position_increments =
      body.enable_position_increments as boolean;
  if (body.fuzziness !== undefined)
    node.fuzziness = body.fuzziness as string | number;
  if (body.fuzzy_prefix_length !== undefined)
    node.fuzzy_prefix_length = body.fuzzy_prefix_length as number;
  if (body.fuzzy_max_expansions !== undefined)
    node.fuzzy_max_expansions = body.fuzzy_max_expansions as number;
  if (body.phrase_slop !== undefined)
    node.phrase_slop = body.phrase_slop as number;
  if (body.auto_generate_synonyms_phrase_query !== undefined)
    node.auto_generate_synonyms_phrase_query =
      body.auto_generate_synonyms_phrase_query as boolean;
  if (body.lenient !== undefined) node.lenient = body.lenient as boolean;
  if (body.minimum_should_match !== undefined)
    node.minimum_should_match = body.minimum_should_match as string | number;
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a fuzzy query
 */
function deserializeFuzzyQuery(
  field: string,
  body: unknown
): FuzzyQueryNode {
  const node: FuzzyQueryNode = {
    id: generateNodeId('fuzzy'),
    type: 'fuzzy',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const fuzzyBody = body as Record<string, unknown>;
    node.value = String(fuzzyBody.value ?? '');

    if (fuzzyBody.fuzziness !== undefined)
      node.fuzziness = fuzzyBody.fuzziness as string | number;
    if (fuzzyBody.prefix_length !== undefined)
      node.prefix_length = fuzzyBody.prefix_length as number;
    if (fuzzyBody.max_expansions !== undefined)
      node.max_expansions = fuzzyBody.max_expansions as number;
    if (fuzzyBody.transpositions !== undefined)
      node.transpositions = fuzzyBody.transpositions as boolean;
    if (fuzzyBody.rewrite) node.rewrite = fuzzyBody.rewrite as string;
    if (fuzzyBody.boost !== undefined)
      node.boost = fuzzyBody.boost as number;
    if (fuzzyBody._name) node._name = fuzzyBody._name as string;
  }

  return node;
}

/**
 * Deserialize an ids query
 */
function deserializeIdsQuery(body: Record<string, unknown>): IdsQueryNode {
  const node: IdsQueryNode = {
    id: generateNodeId('ids'),
    type: 'ids',
    values: body.values as string[],
  };

  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

// =============================================================================
// Main Deserialization Functions
// =============================================================================

/**
 * Deserialize an OpenSearch query DSL object to a QueryNode
 *
 * @param query - The OpenSearch query object
 * @returns A QueryNode structure
 *
 * @example
 * ```typescript
 * const query = {
 *   match: {
 *     title: { query: 'hello world' }
 *   }
 * };
 *
 * const node = deserializeQuery(query);
 * // { id: 'match_1', type: 'match', field: 'title', value: 'hello world' }
 * ```
 */
export function deserializeQuery(query: OpenSearchQuery): QueryNode {
  const keys = Object.keys(query);

  if (keys.length === 0) {
    // Empty query, treat as match_all
    return {
      id: generateNodeId('match_all'),
      type: 'match_all',
    };
  }

  const queryType = keys[0];
  const body = query[queryType];

  switch (queryType) {
    case 'match': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeMatchQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'term': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeTermQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'range': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeRangeQuery(
        field,
        (body as Record<string, unknown>)[field] as Record<string, unknown>
      );
    }

    case 'prefix': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializePrefixQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'wildcard': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeWildcardQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'exists':
      return deserializeExistsQuery(body as Record<string, unknown>);

    case 'bool':
      return deserializeBoolQuery(body as Record<string, unknown>);

    case 'nested':
      return deserializeNestedQuery(body as Record<string, unknown>);

    case 'match_all':
      return deserializeMatchAllQuery((body as Record<string, unknown>) ?? {});

    case 'multi_match':
      return deserializeMultiMatchQuery(body as Record<string, unknown>);

    case 'query_string':
      return deserializeQueryStringQuery(body as Record<string, unknown>);

    case 'fuzzy': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeFuzzyQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'ids':
      return deserializeIdsQuery(body as Record<string, unknown>);

    default:
      // Unknown query type - create a match_all as fallback
      console.warn(`Unknown query type: ${queryType}, falling back to match_all`);
      return {
        id: generateNodeId('match_all'),
        type: 'match_all',
      };
  }
}

/**
 * Deserialize a sort clause from OpenSearch format
 */
function deserializeSortClause(
  clause: Record<string, unknown> | string
): SortClause {
  if (typeof clause === 'string') {
    return {
      field: clause,
      order: 'asc',
    };
  }

  const field = Object.keys(clause)[0];
  const body = clause[field];

  if (typeof body === 'string') {
    return {
      field,
      order: body as SortOrder,
    };
  }

  const sortBody = body as Record<string, unknown>;
  const result: SortClause = {
    field,
    order: (sortBody.order as SortOrder) ?? 'asc',
  };

  if (sortBody.mode) result.mode = sortBody.mode as SortMode;
  if (sortBody.missing) result.missing = sortBody.missing as '_first' | '_last' | string;
  if (sortBody.unmapped_type)
    result.unmapped_type = sortBody.unmapped_type as string;
  if (sortBody.nested) {
    const nestedBody = sortBody.nested as Record<string, unknown>;
    const nestedResult: { path: string; filter?: QueryNode } = {
      path: nestedBody.path as string,
    };
    if (nestedBody.filter) {
      nestedResult.filter = deserializeQuery(nestedBody.filter as OpenSearchQuery);
    }
    result.nested = nestedResult;
  }

  return result;
}

/**
 * Deserialize highlight configuration from OpenSearch format
 */
function deserializeHighlight(
  highlight: Record<string, unknown>
): HighlightConfig {
  const fields = (highlight.fields as Record<string, unknown>) || {};
  const result: HighlightConfig = {
    fields: fields as Record<string, HighlightFieldConfig>,
  };

  if (highlight.pre_tags) {
    result.pre_tags = highlight.pre_tags as string[];
  }
  if (highlight.post_tags) {
    result.post_tags = highlight.post_tags as string[];
  }
  if (highlight.number_of_fragments !== undefined) {
    result.number_of_fragments = highlight.number_of_fragments as number;
  }
  if (highlight.fragment_size !== undefined) {
    result.fragment_size = highlight.fragment_size as number;
  }
  if (highlight.encoder) {
    result.encoder = highlight.encoder as 'default' | 'html';
  }
  if (highlight.require_field_match !== undefined) {
    result.require_field_match = highlight.require_field_match as boolean;
  }
  if (highlight.type) {
    result.type = highlight.type as 'unified' | 'plain' | 'fvh';
  }

  return result;
}

/**
 * Deserialize an OpenSearch request body to QueryState
 *
 * @param body - The OpenSearch request body
 * @returns A QueryState structure
 *
 * @example
 * ```typescript
 * const body = {
 *   query: { match_all: {} },
 *   size: 10,
 *   from: 0
 * };
 *
 * const state = deserializeQueryState(body);
 * // { query: { id: 'match_all_1', type: 'match_all' }, size: 10, from: 0 }
 * ```
 */
export function deserializeQueryState(
  body: OpenSearchRequestBody
): QueryState {
  const state: QueryState = {
    query: null,
  };

  if (body.query) {
    state.query = deserializeQuery(body.query);
  }

  if (body.size !== undefined) state.size = body.size;
  if (body.from !== undefined) state.from = body.from;

  if (body.sort && Array.isArray(body.sort)) {
    state.sort = body.sort.map((clause) =>
      deserializeSortClause(clause as Record<string, unknown> | string)
    );
  }

  if (body.timeout) state.timeout = body.timeout;
  if (body.explain !== undefined) state.explain = body.explain;
  if (body.highlight)
    state.highlight = deserializeHighlight(body.highlight);
  if (body._source !== undefined) state._source = body._source;
  if (body.track_total_hits !== undefined)
    state.track_total_hits = body.track_total_hits;
  if (body.min_score !== undefined) state.min_score = body.min_score;
  if (body.search_after) state.search_after = body.search_after;
  if (body.aggs) state.aggs = body.aggs;

  return state;
}

/**
 * Parse a JSON string and deserialize to QueryState
 *
 * @param json - JSON string of an OpenSearch request body
 * @returns A QueryState structure
 * @throws Error if JSON parsing fails
 */
export function deserializeFromJson(json: string): QueryState {
  const body = JSON.parse(json) as OpenSearchRequestBody;
  return deserializeQueryState(body);
}
