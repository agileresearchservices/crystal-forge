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
  TermsLookup,
  DisMaxQueryNode,
  ConstantScoreQueryNode,
  BoostingQueryNode,
  FunctionScoreQueryNode,
  GeoBoundingBoxQueryNode,
  GeoDistanceQueryNode,
  GeoShapeQueryNode,
  ScoreFunction,
  GeoPoint,
  GeoShape,
  SortClause,
  HighlightConfig,
  HighlightFieldConfig,
  TermSuggesterConfig,
  DirectGenerator,
  PhraseSuggesterConfig,
  SuggesterConfig,
  InnerHitsConfig,
  SortOrder,
  SortMode,
} from './types';

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generate a unique ID for a query node using crypto.randomUUID when available,
 * falling back to Math.random for older environments.
 *
 * This approach avoids SSR hydration mismatches that occur with global counters.
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique string identifier
 *
 * @example
 * ```typescript
 * const id = generateNodeId(); // 'node_a1b2c3d4'
 * const id2 = generateNodeId('match'); // 'match_e5f6g7h8'
 * ```
 */
export function generateNodeId(prefix: string = 'node'): string {
  // Use crypto.randomUUID if available (Node 19+, modern browsers)
  // Otherwise fall back to Math.random
  const uniquePart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${uniquePart}`;
}

/**
 * Reset the node ID counter (deprecated - no longer needed with UUID-based IDs)
 * @deprecated This function is kept for backwards compatibility but has no effect
 */
export function resetNodeIdCounter(): void {
  // No-op: UUID-based IDs don't use a counter
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
    if (matchBody.fuzzy_transpositions !== undefined)
      node.fuzzy_transpositions = matchBody.fuzzy_transpositions as boolean;
    if (matchBody.auto_generate_synonyms_phrase_query !== undefined)
      node.auto_generate_synonyms_phrase_query =
        matchBody.auto_generate_synonyms_phrase_query as boolean;
    if (matchBody.boost !== undefined) node.boost = matchBody.boost as number;
    if (matchBody._name) node._name = matchBody._name as string;
  }

  return node;
}

/**
 * Deserialize a match_phrase query
 */
function deserializeMatchPhraseQuery(
  field: string,
  body: unknown
): MatchPhraseQueryNode {
  const node: MatchPhraseQueryNode = {
    id: generateNodeId('match_phrase'),
    type: 'match_phrase',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const phraseBody = body as Record<string, unknown>;
    node.value = String(phraseBody.query ?? '');

    if (phraseBody.slop !== undefined) node.slop = phraseBody.slop as number;
    if (phraseBody.analyzer) node.analyzer = phraseBody.analyzer as string;
    if (phraseBody.zero_terms_query)
      node.zero_terms_query = phraseBody.zero_terms_query as 'none' | 'all';
    if (phraseBody.boost !== undefined) node.boost = phraseBody.boost as number;
    if (phraseBody._name) node._name = phraseBody._name as string;
  }

  return node;
}

/**
 * Deserialize a match_phrase_prefix query
 */
function deserializeMatchPhrasePrefixQuery(
  field: string,
  body: unknown
): MatchPhrasePrefixQueryNode {
  const node: MatchPhrasePrefixQueryNode = {
    id: generateNodeId('match_phrase_prefix'),
    type: 'match_phrase_prefix',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const prefixBody = body as Record<string, unknown>;
    node.value = String(prefixBody.query ?? '');

    if (prefixBody.slop !== undefined) node.slop = prefixBody.slop as number;
    if (prefixBody.max_expansions !== undefined)
      node.max_expansions = prefixBody.max_expansions as number;
    if (prefixBody.analyzer) node.analyzer = prefixBody.analyzer as string;
    if (prefixBody.zero_terms_query)
      node.zero_terms_query = prefixBody.zero_terms_query as 'none' | 'all';
    if (prefixBody.boost !== undefined) node.boost = prefixBody.boost as number;
    if (prefixBody._name) node._name = prefixBody._name as string;
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
 * Deserialize a terms query
 * Supports both inline values and terms lookup
 */
function deserializeTermsQuery(
  field: string,
  values: unknown,
  boost?: number,
  _name?: string
): TermsQueryNode {
  const node: TermsQueryNode = {
    id: generateNodeId('terms'),
    type: 'terms',
    field,
  };

  // Check if it's a terms lookup (object with index, id, path) or inline values (array)
  if (Array.isArray(values)) {
    node.values = values as (string | number | boolean)[];
  } else if (typeof values === 'object' && values !== null) {
    const lookupBody = values as Record<string, unknown>;
    // It's a terms lookup if it has the required fields
    if ('index' in lookupBody && 'id' in lookupBody && 'path' in lookupBody) {
      const lookup: TermsLookup = {
        index: lookupBody.index as string,
        id: lookupBody.id as string,
        path: lookupBody.path as string,
      };
      if (lookupBody.routing) {
        lookup.routing = lookupBody.routing as string;
      }
      node.lookup = lookup;
    } else {
      // Unknown format, default to empty values
      node.values = [];
    }
  } else {
    node.values = [];
  }

  if (boost !== undefined) node.boost = boost;
  if (_name) node._name = _name;

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
 * Deserialize a regexp query
 */
function deserializeRegexpQuery(
  field: string,
  body: unknown
): RegexpQueryNode {
  const node: RegexpQueryNode = {
    id: generateNodeId('regexp'),
    type: 'regexp',
    field,
    value: '',
  };

  if (typeof body === 'string') {
    node.value = body;
  } else if (typeof body === 'object' && body !== null) {
    const regexpBody = body as Record<string, unknown>;
    node.value = String(regexpBody.value ?? '');

    if (regexpBody.flags) node.flags = regexpBody.flags as string;
    if (regexpBody.case_insensitive !== undefined)
      node.case_insensitive = regexpBody.case_insensitive as boolean;
    if (regexpBody.max_determinized_states !== undefined)
      node.max_determinized_states = regexpBody.max_determinized_states as number;
    if (regexpBody.rewrite) node.rewrite = regexpBody.rewrite as string;
    if (regexpBody.boost !== undefined)
      node.boost = regexpBody.boost as number;
    if (regexpBody._name) node._name = regexpBody._name as string;
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
 * Deserialize inner hits configuration from OpenSearch format
 */
function deserializeInnerHits(
  innerHits: Record<string, unknown>
): InnerHitsConfig {
  const result: InnerHitsConfig = {};

  if (innerHits.name) result.name = innerHits.name as string;
  if (innerHits.from !== undefined) result.from = innerHits.from as number;
  if (innerHits.size !== undefined) result.size = innerHits.size as number;
  if (innerHits._source !== undefined)
    result._source = innerHits._source as InnerHitsConfig['_source'];

  // Deserialize sort clauses
  if (innerHits.sort && Array.isArray(innerHits.sort)) {
    result.sort = innerHits.sort.map((clause) =>
      deserializeSortClause(clause as Record<string, unknown> | string)
    );
  }

  // Deserialize highlight
  if (innerHits.highlight) {
    result.highlight = deserializeHighlight(
      innerHits.highlight as Record<string, unknown>
    );
  }

  return result;
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
  if (body.inner_hits) {
    node.inner_hits = deserializeInnerHits(
      body.inner_hits as Record<string, unknown>
    );
  }
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
 * Deserialize a match_none query
 */
function deserializeMatchNoneQuery(
  body: Record<string, unknown>
): MatchNoneQueryNode {
  const node: MatchNoneQueryNode = {
    id: generateNodeId('match_none'),
    type: 'match_none',
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
  if (body.time_zone) node.time_zone = body.time_zone as string;
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a simple_query_string query
 */
function deserializeSimpleQueryStringQuery(
  body: Record<string, unknown>
): SimpleQueryStringQueryNode {
  const node: SimpleQueryStringQueryNode = {
    id: generateNodeId('simple_query_string'),
    type: 'simple_query_string',
    query: body.query as string,
  };

  if (body.fields) node.fields = body.fields as string[];
  if (body.default_operator)
    node.default_operator = body.default_operator as 'AND' | 'OR';
  if (body.analyzer) node.analyzer = body.analyzer as string;
  if (body.flags) node.flags = body.flags as string;
  if (body.lenient !== undefined) node.lenient = body.lenient as boolean;
  if (body.minimum_should_match !== undefined)
    node.minimum_should_match = body.minimum_should_match as string | number;
  if (body.analyze_wildcard !== undefined)
    node.analyze_wildcard = body.analyze_wildcard as boolean;
  if (body.auto_generate_synonyms_phrase_query !== undefined)
    node.auto_generate_synonyms_phrase_query =
      body.auto_generate_synonyms_phrase_query as boolean;
  if (body.quote_field_suffix)
    node.quote_field_suffix = body.quote_field_suffix as string;
  if (body.fuzzy_prefix_length !== undefined)
    node.fuzzy_prefix_length = body.fuzzy_prefix_length as number;
  if (body.fuzzy_max_expansions !== undefined)
    node.fuzzy_max_expansions = body.fuzzy_max_expansions as number;
  if (body.fuzzy_transpositions !== undefined)
    node.fuzzy_transpositions = body.fuzzy_transpositions as boolean;
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

/**
 * Deserialize a dis_max query
 */
function deserializeDisMaxQuery(body: Record<string, unknown>): DisMaxQueryNode {
  const node: DisMaxQueryNode = {
    id: generateNodeId('dis_max'),
    type: 'dis_max',
    queries: (body.queries as OpenSearchQuery[]).map((q) => deserializeQuery(q)),
  };

  if (body.tie_breaker !== undefined) node.tie_breaker = body.tie_breaker as number;
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a constant_score query
 */
function deserializeConstantScoreQuery(body: Record<string, unknown>): ConstantScoreQueryNode {
  const node: ConstantScoreQueryNode = {
    id: generateNodeId('constant_score'),
    type: 'constant_score',
    filter: deserializeQuery(body.filter as OpenSearchQuery),
  };

  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a boosting query
 */
function deserializeBoostingQuery(body: Record<string, unknown>): BoostingQueryNode {
  const node: BoostingQueryNode = {
    id: generateNodeId('boosting'),
    type: 'boosting',
    positive: deserializeQuery(body.positive as OpenSearchQuery),
    negative: deserializeQuery(body.negative as OpenSearchQuery),
    negative_boost: body.negative_boost as number,
  };

  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a score function
 */
function deserializeScoreFunction(fn: Record<string, unknown>): ScoreFunction {
  const result: ScoreFunction = {};

  if (fn.filter) result.filter = deserializeQuery(fn.filter as OpenSearchQuery);
  if (fn.weight !== undefined) result.weight = fn.weight as number;
  if (fn.script_score) result.script_score = fn.script_score as ScoreFunction['script_score'];
  if (fn.random_score) result.random_score = fn.random_score as ScoreFunction['random_score'];
  if (fn.field_value_factor) result.field_value_factor = fn.field_value_factor as ScoreFunction['field_value_factor'];
  if (fn.linear) result.linear = fn.linear as ScoreFunction['linear'];
  if (fn.exp) result.exp = fn.exp as ScoreFunction['exp'];
  if (fn.gauss) result.gauss = fn.gauss as ScoreFunction['gauss'];

  return result;
}

/**
 * Deserialize a function_score query
 */
function deserializeFunctionScoreQuery(body: Record<string, unknown>): FunctionScoreQueryNode {
  const node: FunctionScoreQueryNode = {
    id: generateNodeId('function_score'),
    type: 'function_score',
  };

  if (body.query) node.query = deserializeQuery(body.query as OpenSearchQuery);
  if (body.functions && Array.isArray(body.functions)) {
    node.functions = (body.functions as Record<string, unknown>[]).map((fn) =>
      deserializeScoreFunction(fn)
    );
  }
  if (body.score_mode) node.score_mode = body.score_mode as FunctionScoreQueryNode['score_mode'];
  if (body.boost_mode) node.boost_mode = body.boost_mode as FunctionScoreQueryNode['boost_mode'];
  if (body.max_boost !== undefined) node.max_boost = body.max_boost as number;
  if (body.min_score !== undefined) node.min_score = body.min_score as number;
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a geo_bounding_box query
 */
function deserializeGeoBoundingBoxQuery(
  field: string,
  body: Record<string, unknown>,
  outerBody: Record<string, unknown>
): GeoBoundingBoxQueryNode {
  const node: GeoBoundingBoxQueryNode = {
    id: generateNodeId('geo_bounding_box'),
    type: 'geo_bounding_box',
    field,
    top_left: body.top_left as GeoPoint,
    bottom_right: body.bottom_right as GeoPoint,
  };

  if (outerBody.validation_method) {
    node.validation_method = outerBody.validation_method as GeoBoundingBoxQueryNode['validation_method'];
  }
  if (outerBody.boost !== undefined) node.boost = outerBody.boost as number;
  if (outerBody._name) node._name = outerBody._name as string;

  return node;
}

/**
 * Deserialize a geo_distance query
 */
function deserializeGeoDistanceQuery(body: Record<string, unknown>): GeoDistanceQueryNode {
  // Find the field (not distance, distance_type, validation_method, boost, or _name)
  const field = Object.keys(body).find(
    (k) => !['distance', 'distance_type', 'validation_method', 'boost', '_name'].includes(k)
  );

  if (!field) {
    throw new Error('geo_distance query missing field');
  }

  const node: GeoDistanceQueryNode = {
    id: generateNodeId('geo_distance'),
    type: 'geo_distance',
    field,
    location: body[field] as GeoPoint,
    distance: body.distance as string,
  };

  if (body.distance_type) node.distance_type = body.distance_type as GeoDistanceQueryNode['distance_type'];
  if (body.validation_method) {
    node.validation_method = body.validation_method as GeoDistanceQueryNode['validation_method'];
  }
  if (body.boost !== undefined) node.boost = body.boost as number;
  if (body._name) node._name = body._name as string;

  return node;
}

/**
 * Deserialize a geo_shape query
 */
function deserializeGeoShapeQuery(
  field: string,
  body: Record<string, unknown>,
  outerBody: Record<string, unknown>
): GeoShapeQueryNode {
  const node: GeoShapeQueryNode = {
    id: generateNodeId('geo_shape'),
    type: 'geo_shape',
    field,
  };

  if (body.shape) node.shape = body.shape as GeoShape;
  if (body.indexed_shape) node.indexed_shape = body.indexed_shape as GeoShapeQueryNode['indexed_shape'];
  if (body.relation) node.relation = body.relation as GeoShapeQueryNode['relation'];
  if (outerBody.boost !== undefined) node.boost = outerBody.boost as number;
  if (outerBody._name) node._name = outerBody._name as string;

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

    case 'match_phrase': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeMatchPhraseQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'match_phrase_prefix': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeMatchPhrasePrefixQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'terms': {
      const termsBody = body as Record<string, unknown>;
      // Find the field name - it's the key whose value is an array or terms_lookup object
      // (not 'boost' or '_name' which are reserved parameters)
      const field = Object.keys(termsBody).find((k) => {
        if (k === 'boost' || k === '_name') return false;
        const val = termsBody[k];
        // Field value is either an array of values or a terms_lookup object
        return Array.isArray(val) || (typeof val === 'object' && val !== null);
      });
      if (!field) {
        return deserializeMatchAllQuery({});
      }
      return deserializeTermsQuery(
        field,
        termsBody[field],
        termsBody.boost as number | undefined,
        termsBody._name as string | undefined
      );
    }

    case 'regexp': {
      const fields = Object.keys(body as Record<string, unknown>);
      const field = fields[0];
      return deserializeRegexpQuery(
        field,
        (body as Record<string, unknown>)[field]
      );
    }

    case 'match_all':
      return deserializeMatchAllQuery((body as Record<string, unknown>) ?? {});

    case 'match_none':
      return deserializeMatchNoneQuery((body as Record<string, unknown>) ?? {});

    case 'multi_match':
      return deserializeMultiMatchQuery(body as Record<string, unknown>);

    case 'query_string':
      return deserializeQueryStringQuery(body as Record<string, unknown>);

    case 'simple_query_string':
      return deserializeSimpleQueryStringQuery(body as Record<string, unknown>);

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

    // Compound queries
    case 'dis_max':
      return deserializeDisMaxQuery(body as Record<string, unknown>);

    case 'constant_score':
      return deserializeConstantScoreQuery(body as Record<string, unknown>);

    case 'boosting':
      return deserializeBoostingQuery(body as Record<string, unknown>);

    case 'function_score':
      return deserializeFunctionScoreQuery(body as Record<string, unknown>);

    // Geo queries
    case 'geo_bounding_box': {
      const geoBody = body as Record<string, unknown>;
      // Find the field (not validation_method, boost, or _name)
      const field = Object.keys(geoBody).find(
        (k) => !['validation_method', 'boost', '_name'].includes(k)
      );
      if (!field) {
        return deserializeMatchAllQuery({});
      }
      return deserializeGeoBoundingBoxQuery(
        field,
        geoBody[field] as Record<string, unknown>,
        geoBody
      );
    }

    case 'geo_distance':
      return deserializeGeoDistanceQuery(body as Record<string, unknown>);

    case 'geo_shape': {
      const geoBody = body as Record<string, unknown>;
      // Find the field (not boost or _name)
      const field = Object.keys(geoBody).find(
        (k) => !['boost', '_name'].includes(k)
      );
      if (!field) {
        return deserializeMatchAllQuery({});
      }
      return deserializeGeoShapeQuery(
        field,
        geoBody[field] as Record<string, unknown>,
        geoBody
      );
    }

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
  if (highlight.order) {
    result.order = highlight.order as 'score';
  }

  return result;
}

/**
 * Deserialize term suggester configuration
 */
function deserializeTermSuggester(body: Record<string, unknown>): TermSuggesterConfig {
  const config: TermSuggesterConfig = {
    field: body.field as string,
  };

  if (body.suggest_mode) config.suggest_mode = body.suggest_mode as 'missing' | 'popular' | 'always';
  if (body.min_word_length !== undefined) config.min_word_length = body.min_word_length as number;
  if (body.prefix_length !== undefined) config.prefix_length = body.prefix_length as number;
  if (body.max_edits !== undefined) config.max_edits = body.max_edits as number;
  if (body.max_inspections !== undefined) config.max_inspections = body.max_inspections as number;
  if (body.max_term_freq !== undefined) config.max_term_freq = body.max_term_freq as number;
  if (body.min_doc_freq !== undefined) config.min_doc_freq = body.min_doc_freq as number;
  if (body.sort) config.sort = body.sort as 'score' | 'frequency';

  return config;
}

/**
 * Deserialize direct generator
 */
function deserializeDirectGenerator(body: Record<string, unknown>): DirectGenerator {
  const gen: DirectGenerator = {
    field: body.field as string,
  };

  if (body.suggest_mode) gen.suggest_mode = body.suggest_mode as 'missing' | 'popular' | 'always';
  if (body.min_word_length !== undefined) gen.min_word_length = body.min_word_length as number;
  if (body.prefix_length !== undefined) gen.prefix_length = body.prefix_length as number;
  if (body.max_edits !== undefined) gen.max_edits = body.max_edits as number;
  if (body.size !== undefined) gen.size = body.size as number;

  return gen;
}

/**
 * Deserialize phrase suggester configuration
 */
function deserializePhraseSuggester(body: Record<string, unknown>): PhraseSuggesterConfig {
  const config: PhraseSuggesterConfig = {
    field: body.field as string,
  };

  if (body.max_errors !== undefined) config.max_errors = body.max_errors as number;
  if (body.confidence !== undefined) config.confidence = body.confidence as number;
  if (body.gram_size !== undefined) config.gram_size = body.gram_size as number;
  if (body.real_word_error_likelihood !== undefined) {
    config.real_word_error_likelihood = body.real_word_error_likelihood as number;
  }
  if (Array.isArray(body.direct_generator)) {
    config.direct_generator = body.direct_generator.map((g) =>
      deserializeDirectGenerator(g as Record<string, unknown>)
    );
  }
  if (body.highlight) config.highlight = body.highlight as { pre_tag?: string; post_tag?: string };
  if (body.collate) config.collate = body.collate as any;

  return config;
}

/**
 * Deserialize suggester configuration
 */
function deserializeSuggester(body: Record<string, unknown>): SuggesterConfig {
  const config: SuggesterConfig = {
    text: body.text as string,
  };

  if (body.term) {
    config.term = deserializeTermSuggester(body.term as Record<string, unknown>);
  }
  if (body.phrase) {
    config.phrase = deserializePhraseSuggester(body.phrase as Record<string, unknown>);
  }

  return config;
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

  if (body.suggest && typeof body.suggest === 'object') {
    state.suggest = Object.entries(body.suggest).reduce(
      (acc, [name, config]) => {
        acc[name] = deserializeSuggester(config as Record<string, unknown>);
        return acc;
      },
      {} as Record<string, SuggesterConfig>
    );
  }

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
