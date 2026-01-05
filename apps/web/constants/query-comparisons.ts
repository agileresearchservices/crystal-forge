/**
 * Query type comparisons for educational purposes
 * Helps users understand the differences between similar query types
 */

export interface ComparisonItem {
  type: string;
  label: string;
  description: string;
  example: string;
  behavior: string;
  bestFor: string;
  performance?: string;
  sqlEquivalent?: string;
  whenToUse: string[];
}

export interface QueryComparison {
  title: string;
  description: string;
  items: ComparisonItem[];
}

export const QUERY_COMPARISONS: Record<string, QueryComparison> = {
  'match-vs-term': {
    title: 'Match vs Term: When to Use Each',
    description: 'Understanding the difference between analyzed and exact matching',
    items: [
      {
        type: 'match',
        label: 'Match Query',
        description: 'Full-text search with analysis',
        example: 'Searching "Quick Brown Fox" matches "quick", "BROWN", "foxes"',
        behavior:
          'Text is analyzed (lowercased, stemmed, tokenized) before matching. Finds word variations and partial matches.',
        bestFor: 'Human-readable text: product names, descriptions, blog posts, comments',
        performance: 'Moderate - requires text analysis and scoring',
        sqlEquivalent: 'LIKE "%search%" with smart word matching',
        whenToUse: [
          'Searching natural language text',
          'When you want to match word variations',
          'Product search, content search, document discovery',
          'When typo tolerance is helpful',
        ],
      },
      {
        type: 'term',
        label: 'Term Query',
        description: 'Exact match (case-sensitive)',
        example: 'Searching "ORDER-12345" only matches exactly "ORDER-12345"',
        behavior:
          'No analysis - exact byte-for-byte match. Looks for the exact value you searched for.',
        bestFor: 'Structured data: IDs, status codes, tags, categories, SKUs',
        performance: 'Very fast - no text analysis, direct lookup',
        sqlEquivalent: 'WHERE field = "exact_value"',
        whenToUse: [
          'Filtering by exact values',
          'Order IDs, user IDs, SKUs, product codes',
          'Status codes (active, pending, completed)',
          'Tags and categories',
          'When you need exact match semantics',
        ],
      },
    ],
  },

  'must-vs-filter': {
    title: 'Must vs Filter: Performance Trade-offs',
    description: 'Understanding scoring vs non-scoring contexts in bool queries',
    items: [
      {
        type: 'must',
        label: 'Must Clause',
        description: 'All conditions must match AND affects relevance score',
        example: 'must: [match: "laptop", match: "gaming"] - ranks results by relevance',
        behavior: 'Conditions must match, relevance scores calculated for each document',
        bestFor: 'When result ranking matters',
        performance: 'Slower - calculates relevance scores for each document',
        sqlEquivalent: 'WHERE condition1 AND condition2 ORDER BY relevance',
        whenToUse: [
          'Full-text search where ranking matters',
          'When you care about which results are "best"',
          'Search queries with user input',
          'When boosting is needed to affect ranking',
        ],
      },
      {
        type: 'filter',
        label: 'Filter Clause',
        description: 'All conditions must match but NO scoring (faster)',
        example: 'filter: [term: "status=active", range: "price < 100"] - yes/no filtering',
        behavior:
          'Conditions must match, no scoring, results cached and reused by OpenSearch',
        bestFor: 'Yes/no filtering that doesn\'t affect relevance',
        performance: 'Fast - no scoring, aggressive caching, excellent for repeated queries',
        sqlEquivalent: 'WHERE condition1 AND condition2 (no ranking)',
        whenToUse: [
          'Yes/no filtering: status, category, boolean flags',
          'Date ranges, price ranges, numeric ranges',
          'When all matching results are equally relevant',
          'Performance-critical queries',
        ],
      },
    ],
  },

  'match-phrase-vs-prefix': {
    title: 'Match Phrase vs Match Phrase Prefix',
    description: 'Different phrase matching strategies',
    items: [
      {
        type: 'match_phrase',
        label: 'Match Phrase',
        description: 'Exact phrase match with word order',
        example: '"quick brown fox" matches documents with that exact phrase in order',
        behavior: 'All words must appear in exact order with no gaps between them',
        bestFor: 'Searching exact phrases, quotes, slogans, multi-word terms',
        whenToUse: [
          'User searches enclosed in quotes',
          'Brand names, product names, exact phrases',
          'When word order matters',
          'Searching common phrases or idioms',
        ],
      },
      {
        type: 'match_phrase_prefix',
        label: 'Match Phrase Prefix',
        description: 'Phrase match where last word is prefix-matched',
        example: '"brown fo" matches "brown fox", "brown folder", "brown foundation"',
        behavior: 'All words except last must match exactly, last word is prefix-matched',
        bestFor: 'Autocomplete, search-as-you-type, suggestions',
        whenToUse: [
          'Autocomplete search boxes',
          'Real-time search suggestions',
          'When user is still typing',
          'Typeahead search scenarios',
        ],
      },
    ],
  },

  'exists-vs-term': {
    title: 'Exists vs Term: Checking for Field Presence',
    description: 'Difference between checking if field exists vs matching exact value',
    items: [
      {
        type: 'exists',
        label: 'Exists Query',
        description: 'Find documents where field is present (has any value)',
        example:
          '"description field exists" finds all documents with description field populated',
        behavior: 'Matches any document where the field has a value (not missing/null)',
        bestFor: 'Finding documents with/without optional fields',
        performance: 'Very fast - simple null/existence check',
        sqlEquivalent: 'WHERE field IS NOT NULL',
        whenToUse: [
          'Finding documents with missing optional fields',
          'Data quality checks',
          'Finding incomplete records',
          'When you only care if field exists, not its value',
        ],
      },
      {
        type: 'term',
        label: 'Term Query',
        description: 'Exact match to specific value',
        example: 'term: status="active" finds only documents with that exact status',
        behavior: 'Matches documents where field exactly equals the specified value',
        bestFor: 'Filtering by specific value',
        performance: 'Very fast - direct value lookup',
        sqlEquivalent: 'WHERE field = "value"',
        whenToUse: [
          'Filtering by specific value',
          'When you care about the actual value',
          'Status/category filtering',
          'Exact match requirements',
        ],
      },
    ],
  },

  'wildcard-vs-regex': {
    title: 'Wildcard vs Regex: Pattern Matching',
    description: 'Different approaches to flexible text pattern matching',
    items: [
      {
        type: 'wildcard',
        label: 'Wildcard Query',
        description: 'Simple pattern matching with ? and *',
        example: 'joh?n matches "john", "johm"; joh* matches "john", "johnny", "johns"',
        behavior: '? matches single character, * matches zero or more characters',
        bestFor: 'Simple patterns, glob-style matching',
        performance: 'Moderate - simpler than regex but slower than term',
        whenToUse: [
          'Simple glob patterns',
          'Partial matching like file extensions',
          'When regex complexity is overkill',
        ],
      },
      {
        type: 'regex',
        label: 'Regex Query',
        description: 'Full regular expression pattern matching',
        example: '[jJ]oh[nh]+ matches "john", "John", "johnn", "jonhh"',
        behavior: 'Supports full regex syntax including character classes, quantifiers, etc.',
        bestFor: 'Complex patterns that need regex power',
        performance: 'Slower - regex evaluation is more expensive',
        whenToUse: [
          'Complex pattern matching',
          'Email/phone validation patterns',
          'When simple wildcard won\'t work',
        ],
      },
    ],
  },
};

/**
 * Mapping of query types to their relevant comparison keys
 */
export const OPERATOR_COMPARISONS: Record<string, string[]> = {
  match: ['match-vs-term'],
  term: ['match-vs-term', 'exists-vs-term'],
  match_phrase: ['match-phrase-vs-prefix'],
  match_phrase_prefix: ['match-phrase-vs-prefix'],
  exists: ['exists-vs-term'],
  wildcard: ['wildcard-vs-regex'],
  regex: ['wildcard-vs-regex'],
};

/**
 * Get comparisons relevant to a specific operator
 */
export function getComparisonsForOperator(operator: string): string[] {
  return OPERATOR_COMPARISONS[operator] || [];
}

/**
 * Get a comparison by its key
 */
export function getComparison(key: string): QueryComparison | undefined {
  return QUERY_COMPARISONS[key];
}

/**
 * Get all available comparison keys
 */
export function getComparisonKeys(): string[] {
  return Object.keys(QUERY_COMPARISONS);
}
