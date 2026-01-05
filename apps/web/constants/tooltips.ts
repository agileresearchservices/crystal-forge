'use client';

import type { QueryType, FieldType } from '@crystal-forge/query-dsl';

type BoolClause = 'must' | 'should' | 'must_not' | 'filter';

export interface TooltipContent {
  title: string;
  description: string;
  examples?: string[];
  sqlEquivalent?: string;
  whenToUse?: string;
  learnMoreUrl?: string;
}

/**
 * Comprehensive tooltips for all OpenSearch query types
 * Helps newbie developers understand when and how to use each operator
 */
export const OPERATOR_TOOLTIPS: Record<QueryType, TooltipContent> = {
  // Full-text queries
  match: {
    title: 'Match Query',
    description:
      'Full-text search with analysis. The text is analyzed the same way as the field was indexed.',
    examples: ['Product names', 'Descriptions', 'Comments', 'User profiles'],
    sqlEquivalent: 'LIKE "%search%" (with smart matching)',
    whenToUse:
      'Use for searching human-readable text where word order and variations matter.',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/full-text/match/',
  },
  match_phrase: {
    title: 'Match Phrase Query',
    description:
      'Exact phrase matching. Words must appear in the exact order specified.',
    examples: ['Exact titles: "Game of Thrones"', 'Quotes', 'Slogans'],
    sqlEquivalent: 'LIKE "%exact phrase%"',
    whenToUse: 'Use when you need to find an exact phrase in the text.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/match-phrase/',
  },
  match_phrase_prefix: {
    title: 'Match Phrase Prefix Query',
    description:
      'Phrase prefix matching. Like phrase but allows the last word to be a prefix.',
    examples: ['Autocomplete: "Game of Th"', 'Type-ahead search'],
    sqlEquivalent: 'LIKE "%phrase%"',
    whenToUse: 'Use for autocomplete and type-ahead search functionality.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/match-phrase-prefix/',
  },
  multi_match: {
    title: 'Multi-Match Query',
    description:
      'Full-text search across multiple fields at once. Useful for searching multiple fields simultaneously.',
    examples: ['Search title, description, and tags together'],
    sqlEquivalent: 'WHERE title LIKE "%term%" OR description LIKE "%term%"',
    whenToUse:
      'Use when you want to search across multiple fields in a single query.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/multi-match/',
  },
  query_string: {
    title: 'Query String Query',
    description:
      'Allows Lucene query syntax with AND, OR, NOT, wildcards, and more. Powerful but can be risky.',
    examples: ['title:(quick OR brown) AND description:fox'],
    sqlEquivalent: 'Complex WHERE clause with AND/OR/NOT',
    whenToUse:
      'Use when users need advanced query syntax. Be cautious with untrusted input.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/query-string/',
  },
  simple_query_string: {
    title: 'Simple Query String',
    description:
      'Simplified Lucene syntax. Like query_string but ignores invalid syntax instead of throwing errors.',
    examples: ['title:(quick brown) description:fox'],
    sqlEquivalent: 'Simple AND/OR/NOT syntax',
    whenToUse:
      'Use when you want query string features but need to handle user input safely.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/simple-query-string/',
  },
  fuzzy: {
    title: 'Fuzzy Query',
    description:
      'Matches terms similar to the search term. Great for handling typos and misspellings.',
    examples: ['Searching "colour" finds "color"', 'Typo tolerance'],
    sqlEquivalent: 'LIKE with typo tolerance',
    whenToUse:
      'Use when you want to find results even if the spelling is slightly wrong.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/fuzzy/',
  },

  // Term-level queries (exact matching, no analysis)
  term: {
    title: 'Term Query',
    description:
      'Exact match (no analysis). The search term is matched exactly against the indexed value.',
    examples: ['Order IDs: "ORDER-12345"', 'Status: "active"', 'Tags: "premium"'],
    sqlEquivalent: 'WHERE field = "exact_value"',
    whenToUse:
      'Use for structured data like IDs, status codes, categories, or tags.',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/term/term/',
  },
  terms: {
    title: 'Terms Query',
    description:
      'Match any of the provided exact values. Useful for filtering by multiple IDs or categories.',
    examples: ['Multiple IDs', 'Multiple statuses', 'Multiple categories'],
    sqlEquivalent: 'WHERE field IN ("value1", "value2", "value3")',
    whenToUse:
      'Use when you want to match any value from a list (OR logic across exact values).',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/term/terms/',
  },
  range: {
    title: 'Range Query',
    description:
      'Find documents where a field value is within a specified range.',
    examples: ['Price: 0-100', 'Date: last 7 days', 'Stock: 10-50 items'],
    sqlEquivalent: 'WHERE field >= x AND field <= y',
    whenToUse:
      'Use for numeric, date, or IP ranges. Perfect for filtering by price, date, or quantity.',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/term/range/',
  },
  prefix: {
    title: 'Prefix Query',
    description: 'Match values that start with the specified prefix.',
    examples: ['Autocomplete for keywords', 'Product codes starting with "PROD-"'],
    sqlEquivalent: 'LIKE "prefix%"',
    whenToUse:
      'Use for prefix matching on keyword or text fields. Good for autocomplete.',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/term/prefix/',
  },
  wildcard: {
    title: 'Wildcard Query',
    description:
      'Pattern matching with wildcards (* for multiple chars, ? for single char).',
    examples: ['he*lo matches "hello"', 'hel?o matches "hello"'],
    sqlEquivalent: 'LIKE with wildcards',
    whenToUse:
      'Use for pattern matching. ⚠️ Can be slow, especially with leading wildcards.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/term/wildcard/',
  },
  regexp: {
    title: 'Regular Expression Query',
    description: 'Match values using regular expression patterns.',
    examples: ['Regex: "joh?n(athan)?"', 'Pattern matching'],
    sqlEquivalent: 'WHERE field REGEXP "pattern"',
    whenToUse:
      'Use for complex pattern matching. ⚠️ Can be slow on large fields.',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/term/regexp/',
  },
  exists: {
    title: 'Exists Query',
    description:
      'Find documents where the specified field has any non-null value.',
    examples: ['Documents with a description', 'Documents with a phone number'],
    sqlEquivalent: 'WHERE field IS NOT NULL',
    whenToUse:
      'Use to filter for documents where a field is present and has a value.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/term/exists/',
  },
  ids: {
    title: 'IDs Query',
    description: 'Match documents by their internal IDs.',
    examples: ['Fetch specific documents by ID'],
    sqlEquivalent: 'WHERE id IN (id1, id2, id3)',
    whenToUse: 'Use when you want to fetch specific documents by their IDs.',
    learnMoreUrl: 'https://opensearch.org/docs/latest/query-dsl/term/ids/',
  },

  // Compound queries
  bool: {
    title: 'Boolean Query',
    description:
      'Combine multiple queries with AND, OR, and NOT logic using must, should, must_not, and filter clauses.',
    examples: ['Combine full-text search with exact filtering'],
    sqlEquivalent: 'WHERE (must) AND NOT (must_not) OR (should)',
    whenToUse:
      'Use to build complex queries by combining multiple conditions.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/bool/',
  },
  dis_max: {
    title: 'Disjunction Max Query',
    description:
      'Returns results matching any query, scored as the maximum score from matching queries.',
    examples: ['Multi-field search with max scoring'],
    sqlEquivalent: 'SELECT * WHERE field1 OR field2 ORDER BY best_match',
    whenToUse:
      'Use for multi-field search where you want the best matching clause to determine the score.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/dis-max/',
  },
  constant_score: {
    title: 'Constant Score Query',
    description:
      'Wraps a filter with a constant score, making all matching documents score the same.',
    examples: ['Apply a boost uniformly to filtered results'],
    sqlEquivalent: 'WHERE condition WITH constant score',
    whenToUse:
      'Use to ignore relevance scoring and give all matches the same score.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/constant-score/',
  },
  boosting: {
    title: 'Boosting Query',
    description:
      'Boosts results of one query relative to another. Returns both, but penalizes the negative query.',
    examples: ['Promote results while keeping alternatives'],
    sqlEquivalent: 'SELECT * ORDER BY (positive BOOST) DESC, (negative) DESC',
    whenToUse:
      'Use to promote certain results while still showing alternatives.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/boosting/',
  },
  function_score: {
    title: 'Function Score Query',
    description:
      'Modify the score of results using functions (e.g., decay functions for distance or date).',
    examples: ['Prefer recent documents', 'Prefer close locations'],
    sqlEquivalent: 'ORDER BY score * function(field)',
    whenToUse:
      'Use to customize scoring based on field values (date, distance, etc).',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/function-score/',
  },

  // Joining queries
  nested: {
    title: 'Nested Query',
    description:
      'Search nested objects as if they were separate documents. Required when using array of objects.',
    examples: ['Search comments by author and date together'],
    sqlEquivalent: 'JOIN on nested array field',
    whenToUse:
      'Use when you have an array of objects and want to query them as a unit.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/joining/nested/',
  },

  // Geo queries
  geo_bounding_box: {
    title: 'Geo Bounding Box Query',
    description:
      'Find documents with geo points within a rectangular bounding box.',
    examples: ['Restaurants within a map boundary', 'Store locations in area'],
    sqlEquivalent: 'WHERE lat BETWEEN x AND y AND lon BETWEEN x AND y',
    whenToUse:
      'Use to find geo points within a rectangular area (not circular).',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/geo/geo-bounding-box/',
  },
  geo_distance: {
    title: 'Geo Distance Query',
    description:
      'Find documents with geo points within a specified distance from a center point.',
    examples: ['Restaurants within 5km', 'Nearby stores within 10 miles'],
    sqlEquivalent: 'WHERE distance(point, center) <= radius',
    whenToUse:
      'Use to find geo points within a circular radius from a center location.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/geo/geo-distance/',
  },
  geo_shape: {
    title: 'Geo Shape Query',
    description:
      'Find documents with geo shapes that intersect, contain, or are within a specified shape.',
    examples: ['Polygons within a boundary', 'Overlapping geographic regions'],
    sqlEquivalent: 'WHERE shape.intersects(boundary)',
    whenToUse:
      'Use for complex geographic shape queries (polygons, lines, etc).',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/geo/geo-shape/',
  },

  // Special queries
  match_all: {
    title: 'Match All Query',
    description: 'Matches all documents in the index. Useful for simple filtering.',
    examples: ['Return all documents, then filter'],
    sqlEquivalent: 'SELECT *',
    whenToUse:
      'Use to match all documents, usually in a bool query for filtering.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/match-all/',
  },
  match_none: {
    title: 'Match None Query',
    description: 'Matches no documents. Opposite of match_all.',
    examples: ['Empty result set'],
    sqlEquivalent: 'WHERE FALSE',
    whenToUse: 'Rarely used; mainly for testing or disabling queries.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/full-text/match-none/',
  },
};

/**
 * Tooltips for bool query clauses
 * Explains the difference between must, should, must_not, and filter
 */
export const CLAUSE_TOOLTIPS: Record<BoolClause, TooltipContent> = {
  must: {
    title: 'Must Clause (AND)',
    description:
      'All conditions MUST match. Results are scored based on how well they match these conditions.',
    examples: [
      'Search for "laptop" in description',
      'Multiple required conditions',
    ],
    sqlEquivalent: 'WHERE condition1 AND condition2 (with ranking)',
    whenToUse:
      'Use when results MUST meet all criteria and you care about relevance ranking.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/bool/',
  },
  should: {
    title: 'Should Clause (OR)',
    description:
      'At least one condition SHOULD match. Results matching more conditions score higher.',
    examples: ['Match "laptop" OR "computer"', 'Optional conditions'],
    sqlEquivalent: 'WHERE condition1 OR condition2 (boosted by matches)',
    whenToUse:
      'Use to boost results that match multiple conditions (OR logic with scoring).',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/bool/',
  },
  must_not: {
    title: 'Must Not Clause (NOT)',
    description:
      'Conditions must NOT match. Matching documents are excluded. Does not affect scoring.',
    examples: ['Exclude discontinued products', 'Exclude inactive users'],
    sqlEquivalent: 'WHERE NOT condition',
    whenToUse:
      'Use to exclude documents that match certain conditions from the results.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/bool/',
  },
  filter: {
    title: 'Filter Clause (Fast AND)',
    description:
      'All conditions MUST match. Faster than "must" because it does NOT calculate relevance scores.',
    examples: [
      'Status = "active"',
      'Category = "electronics"',
      'Price between 0 and 100',
    ],
    sqlEquivalent: 'WHERE condition (no ranking)',
    whenToUse:
      'Use for yes/no filtering: status, category, availability. Much faster than "must" for exact matches.',
    learnMoreUrl:
      'https://opensearch.org/docs/latest/query-dsl/compound/bool/',
  },
};

/**
 * Tooltips for field types
 * Helps developers understand what each field type is for and how to query it
 */
export const FIELD_TYPE_TOOLTIPS: Record<FieldType, string> = {
  // Text types
  text: 'Full-text searchable text that is analyzed (tokenized and normalized). Use "match" query. Examples: product descriptions, article content, comments.',
  keyword:
    'Structured exact-match keyword. NOT analyzed - must match exactly. Use "term" query. Examples: order IDs, product codes, status values, tags.',
  completion:
    'Specialized field type for autocomplete. Optimized for prefix queries and suggestions. Use for typeahead search features.',
  search_as_you_type:
    'Field type optimized for searching as you type. Analyzes in multiple ways for better prefix matching. Good for search interfaces.',
  token_count:
    'Stores the count of tokens in the field. Use for filtering by text length or token count.',
  // Numeric types
  long: 'Integer numbers (up to 64-bit). Use "range" query. Examples: product quantities, user IDs, prices in cents.',
  integer:
    'Integer numbers (up to 32-bit). Use "range" query. Examples: inventory counts, ratings (1-5).',
  short: 'Integer numbers (up to 16-bit). Use "range" query.',
  byte: 'Integer numbers (up to 8-bit). Use "range" query.',
  double:
    'Decimal numbers with high precision. Use "range" query. Examples: prices, coordinates, measurements.',
  float: 'Decimal numbers with regular precision. Use "range" query.',
  half_float: 'Decimal numbers with reduced precision. Use "range" query. More memory efficient than float.',
  scaled_float:
    'Decimal numbers scaled by a fixed factor. Use "range" query. Examples: prices stored as integers.',
  unsigned_long:
    'Large unsigned integer numbers (up to 64-bit, no negative). Use "range" query. Examples: large counters, IDs.',
  // Date types
  date: 'Date/timestamp values. Use "range" query with date math (e.g., now-7d). Examples: created_at, updated_at, last_login.',
  date_nanos:
    'Date/timestamp with nanosecond precision. Use "range" query. Examples: high-precision timestamps, event timing.',
  // Boolean
  boolean: 'True/false values. Use "term" query with true or false. Examples: is_active, is_premium, is_deleted.',
  // Binary
  binary: 'Base64-encoded binary data. Not typically searchable.',
  // IP address
  ip: 'IP addresses (IPv4 or IPv6). Use "term" or "range" query. Examples: user IP, server IP.',
  // Geo types
  geo_point:
    'Geographic coordinates (latitude, longitude). Use "geo_distance" or "geo_bounding_box" query. Examples: store locations, user locations.',
  geo_shape:
    'Complex geographic shapes (polygons, lines). Use "geo_shape" query. Examples: regional boundaries, delivery areas.',
  // Complex types
  nested:
    'Array of objects. Use "nested" query to search as a unit. Examples: array of comments, array of orders.',
  object: 'JSON object structure. Cannot search directly - search nested fields instead.',
  flattened:
    'Flattened object structure that allows searching inside objects without using nested queries. Simpler but less flexible than nested.',
  join: 'Join field type for parent-child relationships. Use with has_parent or has_child queries.',
  // Specialized types
  percolator:
    'Percolator field for storing queries to be used with the percolator query. Advanced feature for reverse searches.',
  rank_feature:
    'Numeric field optimized for ranking calculations. Use with rank_feature query for scoring.',
  rank_features:
    'Multiple numeric fields optimized for ranking. Use with rank_features query for complex scoring.',
  dense_vector:
    'Dense vector field for dense vector search (semantic search, embeddings). Use with dense_vector query.',
  sparse_vector:
    'Sparse vector field for sparse vector search. Use with sparse_vector query. Examples: term frequencies, sparse embeddings.',
  // Aliases
  alias: 'Alias to another field. Allows searching a field by multiple names.',
};
