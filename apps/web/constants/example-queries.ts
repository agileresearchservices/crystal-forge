'use client';

import type { BoolQueryNode } from '@crystal-forge/query-dsl';

/**
 * Example query definition for UI demonstrations
 */
export interface ExampleQuery {
  id: string;
  title: string;
  description: string;
  explanation: string;
  icon: string;
  query: BoolQueryNode;
}

/**
 * Pre-built example queries for the empty state
 * Helps newbie developers understand common query patterns
 */
export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    id: 'simple-text-search',
    title: 'Search Text',
    description: 'Find products by name',
    explanation:
      'Uses a "match" query for full-text search. This is the most common query type for searching product names, descriptions, or any analyzed text field. The text is broken into words and matched flexibly.',
    icon: 'Search',
    query: {
      id: 'example-1',
      type: 'bool',
      must: [
        {
          id: 'example-1-must-0',
          type: 'match',
          field: 'product_name',
          value: 'laptop',
        },
      ],
      should: [],
      must_not: [],
      filter: [],
    },
  },
  {
    id: 'price-filter',
    title: 'Filter by Range',
    description: 'Products under $50',
    explanation:
      'Uses a "range" query in the filter clause to find numeric values within a specific range. Range queries are fast and efficient for filtering by prices, quantities, dates, or any numeric field. The "filter" clause is faster than "must" because it doesn\'t calculate relevance scores.',
    icon: 'DollarSign',
    query: {
      id: 'example-2',
      type: 'bool',
      must: [],
      should: [],
      must_not: [],
      filter: [
        {
          id: 'example-2-filter-0',
          type: 'range',
          field: 'price',
          lte: 50,
        },
      ],
    },
  },
  {
    id: 'bool-combined',
    title: 'Search + Filter',
    description: 'Gaming electronics under $500',
    explanation:
      'Combines a "match" query for full-text search with categorical and range filters for structured data. The "must" clause scores results based on relevance to "gaming", while the "filter" clauses narrow down to electronics products under $500. This is a common pattern: search for what you care about relevance for, filter for categorical and yes/no conditions.',
    icon: 'Combine',
    query: {
      id: 'example-3',
      type: 'bool',
      must: [
        {
          id: 'example-3-must-0',
          type: 'match',
          field: 'description',
          value: 'gaming',
        },
      ],
      should: [],
      must_not: [],
      filter: [
        {
          id: 'example-3-filter-0',
          type: 'term',
          field: 'category',
          value: 'Electronics',
        },
        {
          id: 'example-3-filter-1',
          type: 'range',
          field: 'price',
          gte: 0,
          lte: 500,
        },
      ],
    },
  },
];
