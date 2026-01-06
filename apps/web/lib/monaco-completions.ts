/**
 * Monaco Editor Completion Provider for OpenSearch Query DSL
 * Provides context-aware autocomplete suggestions
 */

import * as monaco from 'monaco-editor';

/**
 * Query type suggestions
 */
const QUERY_TYPES = [
  'match',
  'match_phrase',
  'match_phrase_prefix',
  'multi_match',
  'query_string',
  'simple_query_string',
  'term',
  'terms',
  'range',
  'exists',
  'prefix',
  'wildcard',
  'regexp',
  'fuzzy',
  'bool',
  'boosting',
  'constant_score',
  'dis_max',
  'function_score',
  'nested',
  'geo_distance',
  'geo_bounding_box',
  'match_all',
  'match_none',
];

/**
 * Aggregation type suggestions
 */
const AGGREGATION_TYPES = [
  'terms',
  'stats',
  'extended_stats',
  'date_histogram',
  'histogram',
  'range',
  'cardinality',
  'avg',
  'sum',
  'min',
  'max',
  'value_count',
];

/**
 * Bool clause keywords
 */
const BOOL_CLAUSES = ['must', 'should', 'must_not', 'filter'];

/**
 * Top-level request body properties
 */
const REQUEST_PROPERTIES = [
  'query',
  'aggs',
  'size',
  'from',
  'timeout',
  '_source',
  'highlight',
  'sort',
  'track_scores',
  'explain',
  'version',
  'seq_no_primary_term',
  'pit',
  'search_after',
  'min_score',
  'indices_boost',
];

/**
 * Query node properties
 */
const QUERY_PROPERTIES = [
  'type',
  'id',
  'field',
  'value',
  'values',
  'operator',
  'fuzziness',
  'boost',
  'must',
  'should',
  'must_not',
  'filter',
  'minimum_should_match',
  'query',
  'positive',
  'negative',
  'negative_boost',
  'path',
  'score_mode',
  'lat',
  'lon',
  'distance',
  'fields',
];

/**
 * Get position context in the JSON
 */
function getJsonContext(model: monaco.editor.ITextModel, position: monaco.Position): string {
  const text = model.getValue();
  const offset = model.getOffsetAt(position);

  // Find the nearest opening bracket/brace
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let context = '';

  for (let i = offset - 1; i >= 0; i--) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '}') braceCount++;
    if (char === '{') braceCount--;
    if (char === ']') bracketCount++;
    if (char === '[') bracketCount--;

    if (braceCount === 0 && bracketCount === 0) {
      context += char;
    }

    if (braceCount < 0 || bracketCount < 0) {
      break;
    }
  }

  return context.trim();
}

/**
 * Parse key path from context
 */
function getKeyPath(context: string): string[] {
  const keys: string[] = [];
  const regex = /"([^"]*)":/g;
  let match;

  while ((match = regex.exec(context)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

/**
 * Check if we're in a query context
 */
function isInQueryContext(keyPath: string[]): boolean {
  return (
    keyPath.includes('query') ||
    keyPath.includes('must') ||
    keyPath.includes('should') ||
    keyPath.includes('must_not') ||
    keyPath.includes('filter') ||
    keyPath.includes('positive') ||
    keyPath.includes('negative')
  );
}

/**
 * Check if we're in a bool context
 */
function isInBoolContext(keyPath: string[]): boolean {
  return (
    keyPath[keyPath.length - 2] === 'type' &&
    keyPath[keyPath.length - 1] === 'bool'
  );
}

/**
 * Register Monaco completion provider
 */
export function registerCompletionProvider(
  editor: monaco.editor.IStandaloneCodeEditor
): void {
  monaco.languages.registerCompletionItemProvider('json', {
    provideCompletionItems: (model, position) => {
      const suggestions: any[] = [];
      const lineContent = model.getLineContent(position.lineNumber);
      const lineUntilPosition = lineContent.substring(0, position.column - 1);

      // Determine context
      const context = getJsonContext(model, position);
      const keyPath = getKeyPath(context);

      // Check if we're starting a property name (after : or ,)
      const isPropertyName = lineUntilPosition.match(/[:,]\s*"?$/) || lineUntilPosition.match(/\{\s*"?$/);
      const isPropertyValue = lineUntilPosition.match(/:\s*"?$/) || lineUntilPosition.match(/:\s*\[?$/);

      // Suggest top-level properties
      if (keyPath.length === 0 && isPropertyName) {
        REQUEST_PROPERTIES.forEach((prop) => {
          suggestions.push({
            label: prop,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${prop}": `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `Top-level property`,
            documentation: `Add ${prop} property to the query`,
          });
        });
      }

      // Suggest query types
      if (isPropertyValue && (keyPath[keyPath.length - 1] === 'type' || lineUntilPosition.includes('"type":'))) {
        const isInBool = isInBoolContext(keyPath);
        const types = isInBool ? ['bool', 'match', 'term', 'range', 'exists'] : QUERY_TYPES;

        types.forEach((type) => {
          suggestions.push({
            label: type,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: `"${type}"`,
            detail: `Query type`,
            documentation: `${type} query type`,
          });
        });
      }

      // Suggest aggregation types
      if (isPropertyValue && keyPath[keyPath.length - 1] === 'type' && keyPath[keyPath.length - 3] === 'aggs') {
        AGGREGATION_TYPES.forEach((agg) => {
          suggestions.push({
            label: agg,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: `"${agg}"`,
            detail: `Aggregation type`,
            documentation: `${agg} aggregation`,
          });
        });
      }

      // Suggest bool clauses
      if (isInQueryContext(keyPath) && isPropertyName && lineUntilPosition.includes('"type": "bool"')) {
        BOOL_CLAUSES.forEach((clause) => {
          suggestions.push({
            label: clause,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${clause}": []`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Bool clause',
            documentation: `Add ${clause} clause to bool query`,
          });
        });
      }

      // Suggest query node properties
      if (isPropertyName && isInQueryContext(keyPath)) {
        QUERY_PROPERTIES.forEach((prop) => {
          suggestions.push({
            label: prop,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${prop}": `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `Query property`,
            documentation: `Add ${prop} property`,
          });
        });
      }

      return { suggestions };
    },
  });
}

/**
 * Comprehensive documentation for all OpenSearch query types
 * Used in hover provider to educate users about each query type
 */
const QUERY_TYPE_DOCS: Record<string, { description: string; bestFor: string; tip?: string }> = {
  // Full-text queries
  match: {
    description: 'Full-text search with analysis. Text is tokenized and matched against analyzed field.',
    bestFor: 'Product names, descriptions, comments, user-generated content',
    tip: 'Use on "text" fields, not "keyword" fields',
  },
  match_phrase: {
    description: 'Exact phrase matching. Words must appear in the exact order specified.',
    bestFor: 'Searching exact phrases, quotes, slogans, multi-word terms',
    tip: 'Slower than match but more precise for phrase searches',
  },
  match_phrase_prefix: {
    description: 'Phrase prefix matching. All words except last must match exactly, last word is prefix-matched.',
    bestFor: 'Autocomplete, search-as-you-type, typeahead suggestions',
    tip: 'Great for real-time search boxes',
  },
  multi_match: {
    description: 'Full-text search across multiple fields at once.',
    bestFor: 'Searching title + description + tags together',
    tip: 'Use "best_fields" type for most cases',
  },
  query_string: {
    description: 'Lucene query syntax with AND, OR, NOT, wildcards. Powerful but can throw errors.',
    bestFor: 'Advanced users who know Lucene syntax',
    tip: '⚠️ Can be risky with untrusted input - use simple_query_string instead',
  },
  simple_query_string: {
    description: 'Simplified Lucene syntax. Ignores invalid syntax instead of throwing errors.',
    bestFor: 'User-facing search boxes where input is untrusted',
    tip: 'Safer than query_string for user input',
  },
  fuzzy: {
    description: 'Matches terms similar to the search term using Levenshtein distance.',
    bestFor: 'Handling typos and misspellings (colour → color)',
    tip: 'Set fuzziness to "AUTO" for best results',
  },

  // Term-level queries (exact matching)
  term: {
    description: 'Exact match with no analysis. The value must match exactly as indexed.',
    bestFor: 'IDs, status codes, tags, categories, SKUs - structured data',
    tip: '⚠️ Use on "keyword" fields, NOT "text" fields',
  },
  terms: {
    description: 'Match any of multiple exact values (OR logic across values).',
    bestFor: 'Filtering by multiple IDs, statuses, or categories',
    tip: 'SQL equivalent: WHERE field IN ("a", "b", "c")',
  },
  range: {
    description: 'Match documents where field value is within a specified range.',
    bestFor: 'Prices, dates, quantities, ages - any numeric or date filtering',
    tip: 'Use gte/lte for inclusive, gt/lt for exclusive bounds',
  },
  prefix: {
    description: 'Match values that start with the specified prefix.',
    bestFor: 'Autocomplete on keyword fields, product codes starting with "PROD-"',
  },
  wildcard: {
    description: 'Pattern matching with * (multiple chars) and ? (single char).',
    bestFor: 'Simple glob patterns, partial matching',
    tip: '⚠️ Avoid leading wildcards (*term) - very slow!',
  },
  regexp: {
    description: 'Match values using regular expression patterns.',
    bestFor: 'Complex patterns, email/phone validation',
    tip: '⚠️ Can be slow on large fields',
  },
  exists: {
    description: 'Find documents where the field has any non-null value.',
    bestFor: 'Finding documents with/without optional fields',
    tip: 'SQL equivalent: WHERE field IS NOT NULL',
  },
  ids: {
    description: 'Match documents by their internal document IDs.',
    bestFor: 'Fetching specific documents by ID',
  },

  // Compound queries
  bool: {
    description: 'Combine queries with AND (must), OR (should), NOT (must_not), and fast filtering (filter).',
    bestFor: 'Complex queries combining multiple conditions',
    tip: 'Use "filter" instead of "must" for yes/no conditions (faster!)',
  },
  dis_max: {
    description: 'Returns results matching any query, scored by the best matching clause.',
    bestFor: 'Multi-field search where best match should determine score',
  },
  constant_score: {
    description: 'Wraps a filter with a constant score. All matches get the same score.',
    bestFor: 'When you want to ignore relevance scoring',
  },
  boosting: {
    description: 'Boosts results of one query while penalizing another.',
    bestFor: 'Promoting certain results while keeping alternatives visible',
  },
  function_score: {
    description: 'Modify scores using functions (decay for date/distance, random, field values).',
    bestFor: 'Prefer recent documents, nearby locations, popular items',
    tip: 'Most powerful scoring customization available',
  },

  // Joining queries
  nested: {
    description: 'Search nested objects as if they were separate documents.',
    bestFor: 'Array of objects where you need to match multiple fields together',
    tip: 'Required for searching arrays of objects correctly',
  },

  // Geo queries
  geo_distance: {
    description: 'Find documents within a specified distance from a center point.',
    bestFor: 'Nearby stores, restaurants within 5km, local search',
  },
  geo_bounding_box: {
    description: 'Find documents within a rectangular bounding box.',
    bestFor: 'Map boundary searches, area-based filtering',
  },
  geo_shape: {
    description: 'Find documents with geo shapes that intersect, contain, or are within a shape.',
    bestFor: 'Complex geographic queries with polygons and lines',
  },

  // Special queries
  match_all: {
    description: 'Matches all documents in the index.',
    bestFor: 'Starting point for filtered queries, returning all documents',
  },
  match_none: {
    description: 'Matches no documents. Opposite of match_all.',
    bestFor: 'Testing, disabling queries conditionally',
  },
};

/**
 * Documentation for aggregation types
 */
const AGGREGATION_TYPE_DOCS: Record<string, { description: string; bestFor: string }> = {
  terms: {
    description: 'Group documents by unique values. Returns top N most common values.',
    bestFor: 'Category breakdown, popular tags, status distribution',
  },
  stats: {
    description: 'Calculate min, max, avg, sum, and count for a numeric field.',
    bestFor: 'Basic statistics on prices, quantities, ratings',
  },
  extended_stats: {
    description: 'Stats plus variance, std deviation, and std deviation bounds.',
    bestFor: 'Detailed statistical analysis, anomaly detection',
  },
  date_histogram: {
    description: 'Group documents into time buckets (daily, weekly, monthly).',
    bestFor: 'Trends over time, time-series analysis',
  },
  histogram: {
    description: 'Group documents into numeric buckets of fixed interval.',
    bestFor: 'Price distribution, age ranges, numeric distributions',
  },
  range: {
    description: 'Group documents into custom-defined ranges.',
    bestFor: 'Price tiers (0-100, 100-500, 500+), custom buckets',
  },
  cardinality: {
    description: 'Count approximate unique values in a field.',
    bestFor: 'Unique visitors, distinct categories, unique users',
  },
  avg: {
    description: 'Calculate the average value of a numeric field.',
    bestFor: 'Average price, average rating, mean values',
  },
  sum: {
    description: 'Calculate the total sum of a numeric field.',
    bestFor: 'Total sales, total quantity, cumulative values',
  },
  min: {
    description: 'Find the minimum value of a numeric field.',
    bestFor: 'Lowest price, earliest date, minimum value',
  },
  max: {
    description: 'Find the maximum value of a numeric field.',
    bestFor: 'Highest price, latest date, maximum value',
  },
  value_count: {
    description: 'Count the number of values (including duplicates).',
    bestFor: 'Count of values in a field, document counting',
  },
};

/**
 * Documentation for bool clauses
 */
const BOOL_CLAUSE_DOCS: Record<string, { description: string; tip: string }> = {
  must: {
    description: 'All conditions MUST match. Affects relevance score.',
    tip: 'Use for search queries where ranking matters',
  },
  should: {
    description: 'At least one condition SHOULD match. Boosts score if multiple match.',
    tip: 'Use for OR logic with relevance boosting',
  },
  must_not: {
    description: 'Conditions must NOT match. Excludes documents.',
    tip: 'Use to exclude specific values or conditions',
  },
  filter: {
    description: 'All conditions MUST match. NO scoring (faster!).',
    tip: 'Use for yes/no filtering: status, category, price range',
  },
};

/**
 * Register custom hover provider with documentation
 */
export function registerHoverProvider(): void {
  monaco.languages.registerHoverProvider('json', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const content = word.word;

      // Check query types
      const queryDoc = QUERY_TYPE_DOCS[content];
      if (queryDoc) {
        let markdown = `**${content} query**\n\n${queryDoc.description}\n\n**Best for:** ${queryDoc.bestFor}`;
        if (queryDoc.tip) {
          markdown += `\n\n💡 **Tip:** ${queryDoc.tip}`;
        }
        return { contents: [{ value: markdown }] };
      }

      // Check aggregation types
      const aggDoc = AGGREGATION_TYPE_DOCS[content];
      if (aggDoc) {
        return {
          contents: [
            {
              value: `**${content} aggregation**\n\n${aggDoc.description}\n\n**Best for:** ${aggDoc.bestFor}`,
            },
          ],
        };
      }

      // Check bool clauses
      const boolDoc = BOOL_CLAUSE_DOCS[content];
      if (boolDoc) {
        return {
          contents: [
            {
              value: `**${content} clause**\n\n${boolDoc.description}\n\n💡 **Tip:** ${boolDoc.tip}`,
            },
          ],
        };
      }

      return null;
    },
  });
}
