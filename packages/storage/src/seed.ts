import type { QueryTemplate, AggregationTemplate } from './types';
import type { QueryState } from '@crystal-forge/query-dsl';

/**
 * Built-in query templates
 */
export const BUILT_IN_QUERY_TEMPLATES: Omit<QueryTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  // Common category templates
  {
    name: 'Full-Text Search',
    description: 'Search across text fields for keyword matches',
    category: 'common',
    tags: ['search', 'text', 'basic'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'match',
        field: 'title',
        value: '',
        operator: 'match',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Exact Match',
    description: 'Find exact matches in keyword fields',
    category: 'common',
    tags: ['filter', 'exact', 'keyword'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'term',
        field: 'status',
        value: 'active',
        operator: 'term',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Date Range',
    description: 'Search for documents within a specific date range',
    category: 'common',
    tags: ['filter', 'date', 'range'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'range',
        field: 'created_at',
        operator: 'gte',
        value: '',
        secondValue: '',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Number Range',
    description: 'Filter by numeric value ranges (price, quantity, etc.)',
    category: 'common',
    tags: ['filter', 'numeric', 'range'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'range',
        field: 'price',
        operator: 'gte',
        value: '0',
        secondValue: '1000',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Boolean Filter',
    description: 'Filter documents by boolean field values',
    category: 'common',
    tags: ['filter', 'boolean'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'term',
        field: 'is_active',
        value: 'true',
        operator: 'term',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Field Exists',
    description: 'Find documents that have a specific field populated',
    category: 'common',
    tags: ['filter', 'exists'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'exists',
        field: 'description',
        operator: 'exists',
      },
    } as unknown as QueryState,
  },

  // E-commerce category templates
  {
    name: 'Product Search',
    description: 'Multi-field search across product titles, descriptions, and brands',
    category: 'ecommerce',
    tags: ['ecommerce', 'search', 'products'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'bool',
        must: [
          {
            type: 'multi_match',
            fields: ['title', 'description', 'brand'],
            value: '',
            operator: 'multi_match',
          },
        ],
        should: [],
        must_not: [],
        filter: [],
      },
    } as unknown as QueryState,
  },
  {
    name: 'Category Filter',
    description: 'Filter products by category with additional search terms',
    category: 'ecommerce',
    tags: ['ecommerce', 'filter', 'category'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'bool',
        must: [
          {
            type: 'match',
            field: 'product_name',
            value: '',
            operator: 'match',
          },
        ],
        should: [],
        must_not: [],
        filter: [
          {
            type: 'terms',
            field: 'category',
            value: '',
            operator: 'terms',
          },
        ],
      },
    } as unknown as QueryState,
  },
  {
    name: 'Price Range Filter',
    description: 'Filter products within a specific price range',
    category: 'ecommerce',
    tags: ['ecommerce', 'filter', 'price'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'bool',
        must: [],
        should: [],
        must_not: [],
        filter: [
          {
            type: 'range',
            field: 'price',
            operator: 'gte',
            value: '0',
            secondValue: '1000',
          },
        ],
      },
    } as unknown as QueryState,
  },
  {
    name: 'Faceted Search',
    description: 'Search with category and price aggregations for faceting',
    category: 'ecommerce',
    tags: ['ecommerce', 'search', 'facets', 'aggregations'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'bool',
        must: [
          {
            type: 'match',
            field: 'title',
            value: '',
            operator: 'match',
          },
        ],
        should: [],
        must_not: [],
        filter: [],
      },
      aggs: [
        {
          name: 'categories',
          type: 'terms',
          field: 'category.keyword',
          size: 10,
        },
        {
          name: 'price_ranges',
          type: 'range',
          field: 'price',
          ranges: [
            { from: 0, to: 100 },
            { from: 100, to: 500 },
            { from: 500, to: 1000 },
            { from: 1000 },
          ],
        },
      ],
    } as unknown as QueryState,
  },

  // Advanced category templates
  {
    name: 'Nested Object Query',
    description: 'Search within nested objects (e.g., product reviews, variants)',
    category: 'advanced',
    tags: ['advanced', 'nested'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'bool',
        must: [
          {
            type: 'nested',
            path: 'reviews',
            query: {
              type: 'bool',
              must: [
                {
                  type: 'range',
                  field: 'reviews.rating',
                  operator: 'gte',
                  value: '4',
                },
              ],
              should: [],
              must_not: [],
              filter: [],
            },
          },
        ],
        should: [],
        must_not: [],
        filter: [],
      },
    } as unknown as QueryState,
  },
  {
    name: 'Geo Distance Search',
    description: 'Find documents within a specific distance from a location',
    category: 'advanced',
    tags: ['advanced', 'geo', 'distance'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'bool',
        must: [],
        should: [],
        must_not: [],
        filter: [
          {
            type: 'geo_distance',
            field: 'location',
            lat: '0',
            lon: '0',
            distance: '10km',
          },
        ],
      },
    } as unknown as QueryState,
  },
  {
    name: 'Function Score with Decay',
    description: 'Boost results by recency using Gaussian decay function',
    category: 'advanced',
    tags: ['advanced', 'function_score', 'boost'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'function_score',
        query: {
          type: 'match',
          field: 'title',
          value: '',
          operator: 'match',
        },
        functions: [],
        boost_mode: 'multiply',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Fuzzy Multi-Field Search',
    description: 'Search multiple fields with fuzzy matching for typo tolerance',
    category: 'advanced',
    tags: ['advanced', 'fuzzy', 'multi_match'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'multi_match',
        fields: ['title', 'brand', 'description'],
        value: '',
        operator: 'multi_match',
        fuzziness: 'AUTO',
      },
    } as unknown as QueryState,
  },
  {
    name: 'Boosting Query',
    description: 'Promote certain results while keeping others in results',
    category: 'advanced',
    tags: ['advanced', 'boosting', 'relevance'],
    isBuiltIn: true,
    query: {
      query: {
        type: 'boosting',
        positive: {
          type: 'match',
          field: 'title',
          value: '',
          operator: 'match',
        },
        negative: {
          type: 'match',
          field: 'status',
          value: 'discontinued',
          operator: 'match',
        },
        negative_boost: 0.2,
      },
    } as unknown as QueryState,
  },
];

/**
 * Built-in aggregation templates
 */
export const BUILT_IN_AGGREGATION_TEMPLATES: Omit<AggregationTemplate, 'id' | 'created_at'>[] = [
  {
    name: 'Top 10 by Field',
    description: 'Show top 10 values for a field with document counts',
    category: 'common',
    agg_type: 'terms',
    isBuiltIn: true,
    config: {
      name: 'top_values',
      type: 'terms',
      field: '',
      size: 10,
    },
  },
  {
    name: 'Date Trends (Daily)',
    description: 'Analyze trends over time with daily buckets',
    category: 'common',
    agg_type: 'date_histogram',
    isBuiltIn: true,
    config: {
      name: 'daily_trends',
      type: 'date_histogram',
      field: 'timestamp',
      calendar_interval: 'day',
    },
  },
  {
    name: 'Date Trends (Weekly)',
    description: 'Analyze trends over time with weekly buckets',
    category: 'common',
    agg_type: 'date_histogram',
    isBuiltIn: true,
    config: {
      name: 'weekly_trends',
      type: 'date_histogram',
      field: 'timestamp',
      calendar_interval: 'week',
    },
  },
  {
    name: 'Statistics Summary',
    description: 'Get min, max, average, and sum for a numeric field',
    category: 'common',
    agg_type: 'stats',
    isBuiltIn: true,
    config: {
      name: 'stats',
      type: 'stats',
      field: 'price',
    },
  },
  {
    name: 'Unique Value Count',
    description: 'Count unique/distinct values in a field',
    category: 'common',
    agg_type: 'cardinality',
    isBuiltIn: true,
    config: {
      name: 'unique_count',
      type: 'cardinality',
      field: 'user_id',
      precision_threshold: 100,
    },
  },
  {
    name: 'Price Range Distribution',
    description: 'Distribute items into common price buckets',
    category: 'ecommerce',
    agg_type: 'range',
    isBuiltIn: true,
    config: {
      name: 'price_distribution',
      type: 'range',
      field: 'price',
      ranges: [
        { from: 0, to: 100 },
        { from: 100, to: 500 },
        { from: 500, to: 1000 },
        { from: 1000, to: 5000 },
        { from: 5000 },
      ],
    },
  },
  {
    name: 'Category Breakdown',
    description: 'Count products in each category with nested stats',
    category: 'ecommerce',
    agg_type: 'terms',
    isBuiltIn: true,
    config: {
      name: 'categories',
      type: 'terms',
      field: 'category.keyword',
      size: 20,
    },
  },
];

/**
 * Seed templates into database
 */
export async function seedTemplates(
  saveQueryTemplate: (template: Omit<QueryTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<string>,
  saveAggTemplate: (template: Omit<AggregationTemplate, 'id' | 'created_at'>) => Promise<string>
): Promise<void> {
  // Check if already seeded
  const allQueryTemplates = await Promise.all(
    BUILT_IN_QUERY_TEMPLATES.map((t) => saveQueryTemplate(t).catch(() => null))
  );

  const allAggTemplates = await Promise.all(
    BUILT_IN_AGGREGATION_TEMPLATES.map((t) => saveAggTemplate(t).catch(() => null))
  );

  console.log(`Seeded ${allQueryTemplates.filter((x) => x !== null).length} query templates`);
  console.log(`Seeded ${allAggTemplates.filter((x) => x !== null).length} aggregation templates`);
}
