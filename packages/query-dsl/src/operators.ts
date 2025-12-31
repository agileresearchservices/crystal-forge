/**
 * OpenSearch Query DSL Operators
 *
 * This module provides mappings between field types and their supported
 * query operators, enabling intelligent operator suggestions in the UI.
 */

import type { FieldType, QueryType } from './types';

// =============================================================================
// Operator Definitions
// =============================================================================

/**
 * Operator definition with metadata for UI rendering
 */
export interface OperatorDefinition {
  /** The query type this operator produces */
  queryType: QueryType;
  /** Display label for the operator */
  label: string;
  /** Short description of what the operator does */
  description: string;
  /** Whether this operator requires a value */
  requiresValue: boolean;
  /** For range operators, which comparison to use */
  rangeOperator?: 'gt' | 'gte' | 'lt' | 'lte';
  /** Whether the operator is for range queries */
  isRange?: boolean;
}

/**
 * Common operators available for most field types
 */
const COMMON_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'exists',
    label: 'exists',
    description: 'Field has a value',
    requiresValue: false,
  },
];

/**
 * Text-specific operators (analyzed fields)
 */
const TEXT_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'match',
    label: 'matches',
    description: 'Full-text search with analysis',
    requiresValue: true,
  },
  {
    queryType: 'match',
    label: 'matches phrase',
    description: 'Exact phrase match',
    requiresValue: true,
  },
  {
    queryType: 'multi_match',
    label: 'matches across fields',
    description: 'Search across multiple fields',
    requiresValue: true,
  },
  {
    queryType: 'query_string',
    label: 'query string',
    description: 'Lucene query syntax',
    requiresValue: true,
  },
  {
    queryType: 'fuzzy',
    label: 'fuzzy matches',
    description: 'Fuzzy matching for typo tolerance',
    requiresValue: true,
  },
  {
    queryType: 'wildcard',
    label: 'wildcard',
    description: 'Pattern matching with * and ?',
    requiresValue: true,
  },
  {
    queryType: 'prefix',
    label: 'starts with',
    description: 'Prefix matching',
    requiresValue: true,
  },
  ...COMMON_OPERATORS,
];

/**
 * Keyword-specific operators (not analyzed)
 */
const KEYWORD_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'term',
    label: 'equals',
    description: 'Exact match (case-sensitive)',
    requiresValue: true,
  },
  {
    queryType: 'term',
    label: 'equals (case-insensitive)',
    description: 'Exact match ignoring case',
    requiresValue: true,
  },
  {
    queryType: 'prefix',
    label: 'starts with',
    description: 'Prefix matching',
    requiresValue: true,
  },
  {
    queryType: 'wildcard',
    label: 'wildcard',
    description: 'Pattern matching with * and ?',
    requiresValue: true,
  },
  {
    queryType: 'fuzzy',
    label: 'fuzzy equals',
    description: 'Fuzzy matching for typo tolerance',
    requiresValue: true,
  },
  ...COMMON_OPERATORS,
];

/**
 * Numeric operators (long, integer, short, byte, double, float)
 */
const NUMERIC_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'term',
    label: 'equals',
    description: 'Exact numeric match',
    requiresValue: true,
  },
  {
    queryType: 'range',
    label: 'greater than',
    description: 'Value is greater than',
    requiresValue: true,
    rangeOperator: 'gt',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'greater than or equal',
    description: 'Value is greater than or equal to',
    requiresValue: true,
    rangeOperator: 'gte',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'less than',
    description: 'Value is less than',
    requiresValue: true,
    rangeOperator: 'lt',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'less than or equal',
    description: 'Value is less than or equal to',
    requiresValue: true,
    rangeOperator: 'lte',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'between',
    description: 'Value is within a range',
    requiresValue: true,
    isRange: true,
  },
  ...COMMON_OPERATORS,
];

/**
 * Date operators
 */
const DATE_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'term',
    label: 'equals',
    description: 'Exact date match',
    requiresValue: true,
  },
  {
    queryType: 'range',
    label: 'after',
    description: 'Date is after',
    requiresValue: true,
    rangeOperator: 'gt',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'on or after',
    description: 'Date is on or after',
    requiresValue: true,
    rangeOperator: 'gte',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'before',
    description: 'Date is before',
    requiresValue: true,
    rangeOperator: 'lt',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'on or before',
    description: 'Date is on or before',
    requiresValue: true,
    rangeOperator: 'lte',
    isRange: true,
  },
  {
    queryType: 'range',
    label: 'between',
    description: 'Date is within a range',
    requiresValue: true,
    isRange: true,
  },
  ...COMMON_OPERATORS,
];

/**
 * Boolean operators
 */
const BOOLEAN_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'term',
    label: 'is true',
    description: 'Boolean is true',
    requiresValue: false,
  },
  {
    queryType: 'term',
    label: 'is false',
    description: 'Boolean is false',
    requiresValue: false,
  },
  ...COMMON_OPERATORS,
];

/**
 * Geo-point operators
 */
const GEO_POINT_OPERATORS: OperatorDefinition[] = [
  // Note: Full geo query support would be added here
  // For now, just existence checking
  ...COMMON_OPERATORS,
];

/**
 * Nested object operators
 */
const NESTED_OPERATORS: OperatorDefinition[] = [
  {
    queryType: 'nested',
    label: 'nested query',
    description: 'Query nested documents',
    requiresValue: true,
  },
  ...COMMON_OPERATORS,
];

/**
 * Object field operators
 */
const OBJECT_OPERATORS: OperatorDefinition[] = [
  // Objects are queried via their child fields
  ...COMMON_OPERATORS,
];

// =============================================================================
// Field Type to Operators Mapping
// =============================================================================

/**
 * Mapping of field types to their available operators
 */
export const FIELD_TYPE_OPERATORS: Record<FieldType, OperatorDefinition[]> = {
  text: TEXT_OPERATORS,
  keyword: KEYWORD_OPERATORS,
  long: NUMERIC_OPERATORS,
  integer: NUMERIC_OPERATORS,
  short: NUMERIC_OPERATORS,
  byte: NUMERIC_OPERATORS,
  double: NUMERIC_OPERATORS,
  float: NUMERIC_OPERATORS,
  date: DATE_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
  geo_point: GEO_POINT_OPERATORS,
  nested: NESTED_OPERATORS,
  object: OBJECT_OPERATORS,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get available operators for a given field type
 *
 * @param fieldType - The OpenSearch field type
 * @returns Array of operator definitions available for this field type
 *
 * @example
 * ```typescript
 * const operators = getOperatorsForFieldType('keyword');
 * // Returns keyword operators: equals, starts with, wildcard, etc.
 * ```
 */
export function getOperatorsForFieldType(
  fieldType: FieldType
): OperatorDefinition[] {
  return FIELD_TYPE_OPERATORS[fieldType] ?? COMMON_OPERATORS;
}

/**
 * Get operators that produce a specific query type
 *
 * @param queryType - The target query type
 * @returns Array of operator definitions that produce this query type
 *
 * @example
 * ```typescript
 * const rangeOperators = getOperatorsByQueryType('range');
 * // Returns all operators that produce range queries
 * ```
 */
export function getOperatorsByQueryType(
  queryType: QueryType
): OperatorDefinition[] {
  const operators: OperatorDefinition[] = [];
  const seen = new Set<string>();

  for (const fieldOperators of Object.values(FIELD_TYPE_OPERATORS)) {
    for (const op of fieldOperators) {
      if (op.queryType === queryType && !seen.has(op.label)) {
        operators.push(op);
        seen.add(op.label);
      }
    }
  }

  return operators;
}

/**
 * Check if a query type is valid for a given field type
 *
 * @param fieldType - The OpenSearch field type
 * @param queryType - The query type to check
 * @returns True if the query type is valid for this field type
 *
 * @example
 * ```typescript
 * isQueryTypeValidForField('text', 'match'); // true
 * isQueryTypeValidForField('keyword', 'match'); // false (should use term)
 * ```
 */
export function isQueryTypeValidForField(
  fieldType: FieldType,
  queryType: QueryType
): boolean {
  const operators = getOperatorsForFieldType(fieldType);
  return operators.some((op) => op.queryType === queryType);
}

/**
 * Get the default operator for a field type
 *
 * @param fieldType - The OpenSearch field type
 * @returns The default operator definition for this field type
 *
 * @example
 * ```typescript
 * const defaultOp = getDefaultOperator('text');
 * // Returns the 'matches' operator
 * ```
 */
export function getDefaultOperator(fieldType: FieldType): OperatorDefinition {
  const operators = getOperatorsForFieldType(fieldType);
  // Return the first non-exists operator, or exists if that's all there is
  return (
    operators.find((op) => op.queryType !== 'exists') ??
    operators[0] ?? {
      queryType: 'match_all' as QueryType,
      label: 'match all',
      description: 'Match all documents',
      requiresValue: false,
    }
  );
}
