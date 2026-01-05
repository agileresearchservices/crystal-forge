/**
 * OpenSearch Query DSL JSON Schema for Monaco Editor
 * Provides schema validation and IntelliSense for OpenSearch queries
 */

export const opensearchQuerySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'OpenSearch Query DSL',
  description: 'Schema for OpenSearch Query and Aggregation DSL',
  type: 'object',
  properties: {
    query: {
      description: 'The query clause',
      oneOf: [
        { $ref: '#/definitions/queryNode' },
        { type: 'null' },
      ],
    },
    aggs: {
      description: 'Aggregations to run with the query',
      type: 'object',
      patternProperties: {
        '.*': { $ref: '#/definitions/aggregation' },
      },
    },
    size: {
      description: 'Number of results to return',
      type: 'integer',
      minimum: 0,
      default: 10,
    },
    from: {
      description: 'Starting document offset',
      type: 'integer',
      minimum: 0,
      default: 0,
    },
    timeout: {
      description: 'Query timeout',
      type: 'string',
    },
    _source: {
      description: 'Source field filtering',
      oneOf: [
        { type: 'boolean' },
        { type: 'array', items: { type: 'string' } },
        {
          type: 'object',
          properties: {
            includes: { type: 'array', items: { type: 'string' } },
            excludes: { type: 'array', items: { type: 'string' } },
          },
        },
      ],
    },
    highlight: {
      description: 'Highlight settings',
      type: 'object',
      properties: {
        fields: { type: 'object' },
        pre_tags: { type: 'array', items: { type: 'string' } },
        post_tags: { type: 'array', items: { type: 'string' } },
      },
    },
    sort: {
      description: 'Sort order for results',
      type: 'array',
    },
    track_scores: {
      description: 'Track scores when sorting',
      type: 'boolean',
    },
  },
  definitions: {
    queryNode: {
      description: 'A query node in the DSL tree',
      oneOf: [
        { $ref: '#/definitions/matchQuery' },
        { $ref: '#/definitions/matchPhraseQuery' },
        { $ref: '#/definitions/matchPhrasePrefixQuery' },
        { $ref: '#/definitions/multiMatchQuery' },
        { $ref: '#/definitions/queryStringQuery' },
        { $ref: '#/definitions/termQuery' },
        { $ref: '#/definitions/termsQuery' },
        { $ref: '#/definitions/rangeQuery' },
        { $ref: '#/definitions/existsQuery' },
        { $ref: '#/definitions/prefixQuery' },
        { $ref: '#/definitions/wildcardQuery' },
        { $ref: '#/definitions/regexpQuery' },
        { $ref: '#/definitions/fuzzyQuery' },
        { $ref: '#/definitions/boolQuery' },
        { $ref: '#/definitions/boostingQuery' },
        { $ref: '#/definitions/constantScoreQuery' },
        { $ref: '#/definitions/disMaxQuery' },
        { $ref: '#/definitions/functionScoreQuery' },
        { $ref: '#/definitions/nestedQuery' },
        { $ref: '#/definitions/geoDistanceQuery' },
        { $ref: '#/definitions/geoBoundingBoxQuery' },
        { $ref: '#/definitions/matchAllQuery' },
        { $ref: '#/definitions/matchNoneQuery' },
      ],
    },
    matchQuery: {
      type: 'object',
      properties: {
        type: { const: 'match' },
        id: { type: 'string' },
        field: { type: 'string', description: 'Field name' },
        value: { description: 'Search value' },
        operator: { enum: ['and', 'or'] },
        fuzziness: { type: 'string' },
        boost: { type: 'number' },
      },
      required: ['type'],
    },
    matchPhraseQuery: {
      type: 'object',
      properties: {
        type: { const: 'match_phrase' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { description: 'Phrase to search for' },
        boost: { type: 'number' },
      },
      required: ['type'],
    },
    matchPhrasePrefixQuery: {
      type: 'object',
      properties: {
        type: { const: 'match_phrase_prefix' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { description: 'Phrase prefix to search for' },
        boost: { type: 'number' },
      },
      required: ['type'],
    },
    multiMatchQuery: {
      type: 'object',
      properties: {
        type: { const: 'multi_match' },
        id: { type: 'string' },
        fields: { type: 'array', items: { type: 'string' } },
        value: { description: 'Search value' },
        operator: { const: 'multi_match' },
        fuzziness: { type: 'string' },
      },
      required: ['type'],
    },
    queryStringQuery: {
      type: 'object',
      properties: {
        type: { const: 'query_string' },
        id: { type: 'string' },
        query: { type: 'string', description: 'Query string with boolean operators' },
        default_field: { type: 'string' },
      },
      required: ['type'],
    },
    termQuery: {
      type: 'object',
      properties: {
        type: { const: 'term' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { description: 'Exact value to match' },
        boost: { type: 'number' },
      },
      required: ['type'],
    },
    termsQuery: {
      type: 'object',
      properties: {
        type: { const: 'terms' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { type: 'array', description: 'Values to match' },
      },
      required: ['type'],
    },
    rangeQuery: {
      type: 'object',
      properties: {
        type: { const: 'range' },
        id: { type: 'string' },
        field: { type: 'string' },
        operator: { enum: ['gte', 'lte', 'gt', 'lt'] },
        value: { description: 'Start value' },
        secondValue: { description: 'End value (for ranges)' },
      },
      required: ['type'],
    },
    existsQuery: {
      type: 'object',
      properties: {
        type: { const: 'exists' },
        id: { type: 'string' },
        field: { type: 'string' },
      },
      required: ['type'],
    },
    prefixQuery: {
      type: 'object',
      properties: {
        type: { const: 'prefix' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['type'],
    },
    wildcardQuery: {
      type: 'object',
      properties: {
        type: { const: 'wildcard' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { type: 'string', description: 'Pattern with * and ?' },
      },
      required: ['type'],
    },
    regexpQuery: {
      type: 'object',
      properties: {
        type: { const: 'regexp' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { type: 'string', description: 'Regular expression pattern' },
      },
      required: ['type'],
    },
    fuzzyQuery: {
      type: 'object',
      properties: {
        type: { const: 'fuzzy' },
        id: { type: 'string' },
        field: { type: 'string' },
        value: { description: 'Value for fuzzy matching' },
        fuzziness: { type: 'string' },
      },
      required: ['type'],
    },
    boolQuery: {
      type: 'object',
      properties: {
        type: { const: 'bool' },
        id: { type: 'string' },
        must: { type: 'array', items: { $ref: '#/definitions/queryNode' }, description: 'All conditions must match' },
        should: { type: 'array', items: { $ref: '#/definitions/queryNode' }, description: 'At least one should match' },
        must_not: { type: 'array', items: { $ref: '#/definitions/queryNode' }, description: 'None should match' },
        filter: { type: 'array', items: { $ref: '#/definitions/queryNode' }, description: 'Must match but do not affect score' },
        minimum_should_match: { type: ['integer', 'string'] },
      },
      required: ['type'],
    },
    boostingQuery: {
      type: 'object',
      properties: {
        type: { const: 'boosting' },
        id: { type: 'string' },
        positive: { $ref: '#/definitions/queryNode' },
        negative: { $ref: '#/definitions/queryNode' },
        negative_boost: { type: 'number' },
      },
      required: ['type'],
    },
    constantScoreQuery: {
      type: 'object',
      properties: {
        type: { const: 'constant_score' },
        id: { type: 'string' },
        filter: { $ref: '#/definitions/queryNode' },
        boost: { type: 'number' },
      },
      required: ['type'],
    },
    disMaxQuery: {
      type: 'object',
      properties: {
        type: { const: 'dis_max' },
        id: { type: 'string' },
        queries: { type: 'array', items: { $ref: '#/definitions/queryNode' } },
        tie_breaker: { type: 'number' },
      },
      required: ['type'],
    },
    functionScoreQuery: {
      type: 'object',
      properties: {
        type: { const: 'function_score' },
        id: { type: 'string' },
        query: { $ref: '#/definitions/queryNode' },
        functions: { type: 'array' },
        boost_mode: { enum: ['multiply', 'replace', 'sum', 'avg', 'max', 'min'] },
      },
      required: ['type'],
    },
    nestedQuery: {
      type: 'object',
      properties: {
        type: { const: 'nested' },
        id: { type: 'string' },
        path: { type: 'string', description: 'Path to nested field' },
        query: { $ref: '#/definitions/queryNode' },
        score_mode: { enum: ['avg', 'sum', 'min', 'max', 'none'] },
      },
      required: ['type'],
    },
    geoDistanceQuery: {
      type: 'object',
      properties: {
        type: { const: 'geo_distance' },
        id: { type: 'string' },
        field: { type: 'string' },
        lat: { type: 'string', description: 'Latitude' },
        lon: { type: 'string', description: 'Longitude' },
        distance: { type: 'string', description: 'Distance with unit (e.g., 10km)' },
      },
      required: ['type'],
    },
    geoBoundingBoxQuery: {
      type: 'object',
      properties: {
        type: { const: 'geo_bounding_box' },
        id: { type: 'string' },
        field: { type: 'string' },
        top_left_lat: { type: 'string' },
        top_left_lon: { type: 'string' },
        bottom_right_lat: { type: 'string' },
        bottom_right_lon: { type: 'string' },
      },
      required: ['type'],
    },
    matchAllQuery: {
      type: 'object',
      properties: {
        type: { const: 'match_all' },
        id: { type: 'string' },
        boost: { type: 'number' },
      },
      required: ['type'],
    },
    matchNoneQuery: {
      type: 'object',
      properties: {
        type: { const: 'match_none' },
        id: { type: 'string' },
      },
      required: ['type'],
    },
    aggregation: {
      description: 'An aggregation',
      oneOf: [
        { $ref: '#/definitions/termsAggregation' },
        { $ref: '#/definitions/statsAggregation' },
        { $ref: '#/definitions/dateHistogramAggregation' },
        { $ref: '#/definitions/histogramAggregation' },
        { $ref: '#/definitions/rangeAggregation' },
        { $ref: '#/definitions/cardinalityAggregation' },
        { $ref: '#/definitions/avgAggregation' },
        { $ref: '#/definitions/sumAggregation' },
        { $ref: '#/definitions/minAggregation' },
        { $ref: '#/definitions/maxAggregation' },
        { $ref: '#/definitions/valueCountAggregation' },
      ],
    },
    termsAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'terms' },
        field: { type: 'string' },
        size: { type: 'integer', minimum: 1 },
        order: { type: 'object' },
      },
      required: ['type', 'field'],
    },
    statsAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'stats' },
        field: { type: 'string' },
      },
      required: ['type', 'field'],
    },
    dateHistogramAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'date_histogram' },
        field: { type: 'string' },
        calendar_interval: { type: 'string' },
        fixed_interval: { type: 'string' },
      },
      required: ['type', 'field'],
    },
    histogramAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'histogram' },
        field: { type: 'string' },
        interval: { type: 'number' },
      },
      required: ['type', 'field'],
    },
    rangeAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'range' },
        field: { type: 'string' },
        ranges: { type: 'array' },
      },
      required: ['type', 'field'],
    },
    cardinalityAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'cardinality' },
        field: { type: 'string' },
        precision_threshold: { type: 'integer' },
      },
      required: ['type', 'field'],
    },
    avgAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'avg' },
        field: { type: 'string' },
      },
      required: ['type', 'field'],
    },
    sumAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'sum' },
        field: { type: 'string' },
      },
      required: ['type', 'field'],
    },
    minAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'min' },
        field: { type: 'string' },
      },
      required: ['type', 'field'],
    },
    maxAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'max' },
        field: { type: 'string' },
      },
      required: ['type', 'field'],
    },
    valueCountAggregation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { const: 'value_count' },
        field: { type: 'string' },
      },
      required: ['type', 'field'],
    },
  },
};
