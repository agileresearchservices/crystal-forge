import type { Aggregation } from '@crystal-forge/query-dsl';

/**
 * Aggregation template interface
 */
export interface AggregationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'common' | 'ecommerce' | 'analytics';
  // Using any here to avoid type conflicts with discriminated union
  // The actual aggregation will be typed correctly when used
  aggregation: any;
}

/**
 * Pre-built aggregation templates for quick setup
 * Users can select these templates to quickly add common aggregations
 */
export const AGGREGATION_TEMPLATES: AggregationTemplate[] = [
  // Common Aggregations
  {
    id: 'top-10-categories',
    name: 'Top 10 Categories',
    description: 'Count documents by category field, show top 10',
    category: 'common',
    aggregation: {
      type: 'terms',
      field: 'category',
      size: 10,
      order: { _count: 'desc' },
    },
  },
  {
    id: 'unique-values',
    name: 'Unique Values',
    description: 'Count unique/distinct values in a field',
    category: 'common',
    aggregation: {
      type: 'cardinality',
      field: 'user_id',
    },
  },
  {
    id: 'average-value',
    name: 'Average Value',
    description: 'Calculate average of a numeric field',
    category: 'common',
    aggregation: {
      type: 'avg',
      field: 'amount',
    },
  },
  {
    id: 'min-max-stats',
    name: 'Min/Max/Avg Statistics',
    description: 'Get comprehensive stats: min, max, avg, sum, count',
    category: 'common',
    aggregation: {
      type: 'stats',
      field: 'price',
    },
  },
  // E-commerce Aggregations
  {
    id: 'sales-over-time',
    name: 'Sales Over Time',
    description: 'Time series breakdown of sales by day',
    category: 'ecommerce',
    aggregation: {
      type: 'date_histogram',
      field: 'timestamp',
      calendar_interval: '1d',
      time_zone: 'UTC',
    },
  },
  {
    id: 'price-distribution',
    name: 'Price Distribution',
    description: 'Bucket products into price ranges',
    category: 'ecommerce',
    aggregation: {
      type: 'histogram',
      field: 'price',
    },
  },
  {
    id: 'total-revenue',
    name: 'Total Revenue',
    description: 'Sum of revenue field',
    category: 'ecommerce',
    aggregation: {
      type: 'sum',
      field: 'revenue',
    },
  },
  {
    id: 'product-sales-stats',
    name: 'Product Sales Stats',
    description: 'Extended statistics for product sales (with std deviation)',
    category: 'ecommerce',
    aggregation: {
      type: 'extended_stats',
      field: 'units_sold',
      sigma: 2,
    },
  },
  // Analytics Aggregations
  {
    id: 'events-by-type',
    name: 'Events by Type',
    description: 'Count events grouped by event type',
    category: 'analytics',
    aggregation: {
      type: 'terms',
      field: 'event_type',
      size: 20,
      order: { _count: 'desc' },
    },
  },
  {
    id: 'response-time-stats',
    name: 'Response Time Stats',
    description: 'Analyze response time distribution',
    category: 'analytics',
    aggregation: {
      type: 'extended_stats',
      field: 'response_time_ms',
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: 'common' | 'ecommerce' | 'analytics'
): AggregationTemplate[] {
  return AGGREGATION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): AggregationTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return AGGREGATION_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): AggregationTemplate | undefined {
  return AGGREGATION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Create an aggregation from a template, with custom field if needed
 */
export function createAggregationFromTemplate(
  template: AggregationTemplate,
  field?: string,
  customName?: string
): Aggregation {
  return {
    ...template.aggregation,
    name: customName || template.aggregation.name || template.name,
    field: field || template.aggregation.field,
  } as Aggregation;
}
