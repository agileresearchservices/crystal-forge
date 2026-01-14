'use client';

import type { QueryNode, BoolQueryNode, MatchQueryNode, RangeQueryNode, TermQueryNode, NestedQueryNode } from '@crystal-forge/query-dsl';
import { generateNodeId } from '@/context/QueryContext';

/**
 * Query template definition for quick-start menu
 */
export interface QueryTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Basic' | 'Filtering' | 'Advanced';
  icon: string;
  helpText: string;
  query: QueryNode;
}

/**
 * Create a simple match query template
 */
function createMatchTemplate(): MatchQueryNode {
  return {
    id: generateNodeId(),
    type: 'match',
    field: '',
    value: '',
  };
}

/**
 * Create a simple term query template
 */
function createTermTemplate(): TermQueryNode {
  return {
    id: generateNodeId(),
    type: 'term',
    field: '',
    value: '',
  };
}

/**
 * Create a range query template
 */
function createRangeTemplate(): RangeQueryNode {
  return {
    id: generateNodeId(),
    type: 'range',
    field: '',
  };
}

/**
 * Create a bool query with must clause
 */
function createBoolTemplate(): BoolQueryNode {
  return {
    id: generateNodeId(),
    type: 'bool',
    must: [],
    should: [],
    must_not: [],
    filter: [],
  };
}

/**
 * Create a nested query template
 */
function createNestedTemplate(): NestedQueryNode {
  return {
    id: generateNodeId(),
    type: 'nested',
    path: '',
    query: {
      id: generateNodeId(),
      type: 'match',
      field: '',
      value: '',
    },
  };
}

/**
 * Pre-built query templates organized by category
 * Helps developers start with the right query type
 */
export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'template-match',
    title: 'Full-Text Search',
    description: 'Match on text fields',
    category: 'Basic',
    icon: 'Search',
    helpText: 'Find records by searching text fields. Perfect for product names, descriptions, or any analyzed text. The text is tokenized and matched flexibly.',
    query: createMatchTemplate(),
  },
  {
    id: 'template-term',
    title: 'Exact Match',
    description: 'Match exact keywords',
    category: 'Basic',
    icon: 'Tag',
    helpText: 'Find exact matches on keyword fields. Use for categories, statuses, IDs, or any non-analyzed field. Fast and precise matching.',
    query: createTermTemplate(),
  },
  {
    id: 'template-range',
    title: 'Range Query',
    description: 'Filter by number/date ranges',
    category: 'Filtering',
    icon: 'Sliders',
    helpText: 'Find records within a numeric or date range. Great for prices, quantities, dates, or any ordered field. Use >, >=, <, <= operators.',
    query: createRangeTemplate(),
  },
  {
    id: 'template-bool',
    title: 'Boolean Logic',
    description: 'Combine multiple conditions',
    category: 'Basic',
    icon: 'GitBranch',
    helpText: 'Build complex queries with must (AND), should (OR), must_not (NOT), and filter clauses. The foundation of advanced search.',
    query: createBoolTemplate(),
  },
  {
    id: 'template-nested',
    title: 'Nested Query',
    description: 'Search nested objects',
    category: 'Advanced',
    icon: 'Boxes',
    helpText: 'Query nested document structures. Use when your index has nested fields (arrays of objects). Preserves relationships between sub-object fields.',
    query: createNestedTemplate(),
  },
];

/**
 * Group templates by category
 */
export function getTemplatesByCategory(category: QueryTemplate['category']): QueryTemplate[] {
  return QUERY_TEMPLATES.filter((t) => t.category === category);
}
