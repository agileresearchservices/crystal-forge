'use client';

import React, { useCallback } from 'react';
import { useQuery, generateNodeId } from '@/context/QueryContext';
import { useConnection } from '@/context/ConnectionContext';
import { OperatorSelector } from './OperatorSelector';
import { BooleanGroup } from './BooleanGroup';
import { FieldInspector } from '@/components/FieldInspector/FieldInspector';
import type {
  QueryNode,
  BoolQueryNode,
  MatchQueryNode,
  TermQueryNode,
  RangeQueryNode,
  ExistsQueryNode,
  PrefixQueryNode,
  WildcardQueryNode,
  FuzzyQueryNode,
  FieldType,
} from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { AlertCircle, AlertTriangle } from 'lucide-react';

/**
 * Placeholder examples for different query types
 * Helps new users understand what format to use for each query type
 */
const QUERY_TYPE_PLACEHOLDERS: Record<string, string> = {
  match: 'e.g., "laptop computer" or "gaming keyboard"',
  match_phrase: 'e.g., "quick brown fox" (exact phrase)',
  match_phrase_prefix: 'e.g., "quick bro" (autocomplete)',
  multi_match: 'e.g., "laptop" (searches multiple fields)',
  query_string: 'e.g., title:laptop AND price:[100 TO 500]',
  simple_query_string: 'e.g., laptop +gaming -refurbished',
  term: 'e.g., "ORDER-12345" or "active" (exact match)',
  terms: 'e.g., value1, value2, value3',
  prefix: 'e.g., "PROD-" (matches PROD-001, PROD-002)',
  wildcard: 'e.g., "john*" or "jo?n"',
  regexp: 'e.g., "joh?n(athan)?"',
  fuzzy: 'e.g., "laptap" (matches "laptop" with typos)',
  ids: 'e.g., doc1, doc2, doc3',
};

/**
 * Placeholder examples based on field type (fallback if query type not specific)
 */
const FIELD_TYPE_PLACEHOLDERS: Record<string, string> = {
  text: 'e.g., "search terms here"',
  keyword: 'e.g., "exact-value" (case-sensitive)',
  long: 'e.g., 12345',
  integer: 'e.g., 100',
  double: 'e.g., 99.99',
  float: 'e.g., 3.14',
  date: 'e.g., 2024-01-15 or "now-7d"',
  ip: 'e.g., 192.168.1.1 or 10.0.0.0/8',
  geo_point: 'e.g., 40.7128,-74.0060',
};

/**
 * Field type mismatch warnings to prevent common beginner mistakes
 * Returns warning message if there's a potential issue, null otherwise
 */
interface FieldMismatchWarning {
  message: string;
  suggestion: string;
  severity: 'warning' | 'error';
}

function getFieldTypeMismatchWarning(
  queryType: string,
  fieldType: FieldType
): FieldMismatchWarning | null {
  // Using match/match_phrase on keyword field
  if (
    ['match', 'match_phrase', 'match_phrase_prefix', 'multi_match'].includes(queryType) &&
    fieldType === 'keyword'
  ) {
    return {
      message: 'Using full-text search on a keyword field may not work as expected.',
      suggestion: 'Consider using "term" for exact matching on keyword fields.',
      severity: 'warning',
    };
  }

  // Using term on text field
  if (queryType === 'term' && fieldType === 'text') {
    return {
      message: 'Using "term" on a text field requires exact case-sensitive match.',
      suggestion: 'Consider using "match" for full-text search on text fields.',
      severity: 'warning',
    };
  }

  // Using range on text/keyword field
  if (queryType === 'range' && ['text', 'keyword'].includes(fieldType)) {
    return {
      message: 'Range queries on text/keyword fields compare lexicographically.',
      suggestion: 'Range queries work best on numeric or date fields.',
      severity: 'warning',
    };
  }

  // Using fuzzy on numeric field
  if (queryType === 'fuzzy' && ['long', 'integer', 'double', 'float'].includes(fieldType)) {
    return {
      message: 'Fuzzy queries are designed for text, not numeric fields.',
      suggestion: 'Use "range" query for numeric comparisons.',
      severity: 'warning',
    };
  }

  // Using wildcard on analyzed text field
  if (['wildcard', 'regexp'].includes(queryType) && fieldType === 'text') {
    return {
      message: 'Wildcard/regex on text fields matches against analyzed tokens, not original text.',
      suggestion: 'Use on keyword fields or add a .keyword subfield.',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Props for QueryNodeComponent
 */
interface QueryNodeProps {
  node: QueryNode;
  path: string[];
  onRemove: () => void;
}

/**
 * Individual query clause component
 * Renders different UI based on node type
 */
export function QueryNodeComponent({ node, path, onRemove }: QueryNodeProps) {
  const { updateNode } = useQuery();
  const { state: connectionState } = useConnection();

  const fields = connectionState.fields;
  // Validation temporarily disabled - will be re-enabled in future update
  const hasErrors = false;
  const hasWarnings = false;

  /**
   * Get field type for the current node's field
   */
  const getFieldType = useCallback(
    (fieldPath: string): FieldType => {
      const field = fields.find((f) => f.path === fieldPath);
      return (field?.type as FieldType) || 'text';
    },
    [fields]
  );

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback(
    (fieldPath: string) => {
      updateNode(path, node.id, { field: fieldPath } as Partial<QueryNode>);
    },
    [updateNode, path, node.id]
  );

  /**
   * Handle value change
   */
  const handleValueChange = useCallback(
    (value: string | number | boolean) => {
      updateNode(path, node.id, { value } as Partial<QueryNode>);
    },
    [updateNode, path, node.id]
  );

  /**
   * Handle query type change
   */
  const handleTypeChange = useCallback(
    (newType: QueryNode['type']) => {
      updateNode(path, node.id, { type: newType } as Partial<QueryNode>);
    },
    [updateNode, path, node.id]
  );

  // Render bool query as BooleanGroup
  if (node.type === 'bool') {
    return <BooleanGroup node={node as BoolQueryNode} path={path} />;
  }

  // Get field for the node
  const nodeField = 'field' in node ? (node as { field: string }).field : '';
  const fieldType = getFieldType(nodeField);

  // Check for field type mismatch warnings
  const fieldMismatchWarning = nodeField
    ? getFieldTypeMismatchWarning(node.type, fieldType)
    : null;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 p-3 rounded-lg',
        'transition-colors',
        'bg-white border hover:border-gray-300',
        fieldMismatchWarning ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'
      )}
    >
      {/* Main query row */}
      <div className="flex items-start gap-2">
        {/* Field Selector */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field
          </label>
          <select
            value={nodeField}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={cn(
              'w-full px-2 py-1.5 text-sm rounded-md',
              'border border-gray-300 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            )}
          >
            <option value="">Select field...</option>
            {fields.map((field) => (
              <option key={field.path} value={field.path}>
                {field.path} ({field.type})
              </option>
            ))}
          </select>
          {/* Field Inspector - shows stats when field is selected */}
          {nodeField && <FieldInspector fieldName={nodeField} fieldType={fieldType} />}
        </div>

        {/* Operator Selector */}
        <div className="w-40">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Operator
          </label>
          <OperatorSelector
            fieldType={fieldType}
            value={node.type}
            onChange={handleTypeChange}
          />
        </div>

        {/* Value Input */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Value
          </label>
          <ValueInput
            node={node}
            fieldType={fieldType}
            onChange={handleValueChange}
          />
        </div>

        {/* Remove Button */}
        <div className="pt-5">
          <button
            onClick={onRemove}
            className={cn(
              'p-1.5 rounded-md',
              'text-gray-400 hover:text-red-500 hover:bg-red-50',
              'transition-colors'
            )}
            title="Remove clause"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Field type mismatch warning */}
      {fieldMismatchWarning && (
        <div
          className="flex items-start gap-2 px-3 py-2 bg-amber-100 border border-amber-200 rounded-md text-sm"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-amber-800">
            <p className="font-medium">{fieldMismatchWarning.message}</p>
            <p className="text-amber-700 mt-0.5">{fieldMismatchWarning.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get placeholder text based on query type and field type
 */
function getPlaceholder(queryType: string, fieldType: FieldType): string {
  // First check query-type-specific placeholders
  if (QUERY_TYPE_PLACEHOLDERS[queryType]) {
    return QUERY_TYPE_PLACEHOLDERS[queryType];
  }
  // Fall back to field-type-specific placeholders
  if (FIELD_TYPE_PLACEHOLDERS[fieldType]) {
    return FIELD_TYPE_PLACEHOLDERS[fieldType];
  }
  // Default placeholder
  return 'Enter value...';
}

/**
 * Value input component that changes based on field type and query type
 */
interface ValueInputProps {
  node: QueryNode;
  fieldType: FieldType;
  onChange: (value: string | number | boolean) => void;
}

function ValueInput({ node, fieldType, onChange }: ValueInputProps) {
  const placeholder = getPlaceholder(node.type, fieldType);
  // Exists query doesn't need a value
  if (node.type === 'exists') {
    return (
      <div className="px-2 py-1.5 text-sm text-gray-500 italic">
        No value needed
      </div>
    );
  }

  // Get the current value from the node
  const getValue = (): string => {
    if ('value' in node) {
      const value = (node as MatchQueryNode | TermQueryNode | PrefixQueryNode | WildcardQueryNode | FuzzyQueryNode).value;
      return String(value ?? '');
    }
    if (node.type === 'range') {
      const rangeNode = node as RangeQueryNode;
      // Show a simple representation
      const rangeVal = rangeNode.gte ?? rangeNode.gt ?? rangeNode.lte ?? rangeNode.lt;
      return rangeVal != null ? String(rangeVal) : '';
    }
    return '';
  };

  // Boolean field type
  if (fieldType === 'boolean') {
    const value = getValue();
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === 'true')}
        className={cn(
          'w-full px-2 py-1.5 text-sm rounded-md',
          'border border-gray-300 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        )}
      >
        <option value="">Select...</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  // Date field type
  if (fieldType === 'date') {
    return (
      <input
        type="datetime-local"
        value={getValue()}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-2 py-1.5 text-sm rounded-md',
          'border border-gray-300 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        )}
      />
    );
  }

  // Numeric field types
  if (['long', 'integer', 'short', 'byte', 'double', 'float'].includes(fieldType)) {
    return (
      <input
        type="number"
        value={getValue()}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          onChange(isNaN(num) ? e.target.value : num);
        }}
        className={cn(
          'w-full px-2 py-1.5 text-sm rounded-md',
          'border border-gray-300 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        )}
        placeholder={placeholder}
      />
    );
  }

  // Range query special handling
  if (node.type === 'range') {
    return <RangeValueInput node={node as RangeQueryNode} onChange={onChange} />;
  }

  // Default text input (with spellcheck enabled)
  return (
    <input
      type="text"
      value={getValue()}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={true}
      className={cn(
        'w-full px-2 py-1.5 text-sm rounded-md',
        'border border-gray-300 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      )}
      placeholder={placeholder}
    />
  );
}

/**
 * Special input for range queries
 */
interface RangeValueInputProps {
  node: RangeQueryNode;
  onChange: (value: string | number | boolean) => void;
}

function RangeValueInput({ node, onChange }: RangeValueInputProps) {
  const { updateNode } = useQuery();

  const handleRangeChange = useCallback(
    (field: 'gt' | 'gte' | 'lt' | 'lte', value: string) => {
      // For simplicity, we'll update through the parent onChange
      // In a real implementation, this would update specific range fields
      onChange(value);
    },
    [onChange]
  );

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={node.gte ?? node.gt ?? ''}
        onChange={(e) => handleRangeChange('gte', e.target.value)}
        className={cn(
          'flex-1 px-2 py-1.5 text-sm rounded-md',
          'border border-gray-300 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        )}
        placeholder="From..."
      />
      <span className="py-1.5 text-gray-400">to</span>
      <input
        type="text"
        value={node.lte ?? node.lt ?? ''}
        onChange={(e) => handleRangeChange('lte', e.target.value)}
        className={cn(
          'flex-1 px-2 py-1.5 text-sm rounded-md',
          'border border-gray-300 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        )}
        placeholder="To..."
      />
    </div>
  );
}

export default QueryNodeComponent;
