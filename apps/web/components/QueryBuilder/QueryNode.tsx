'use client';

import React, { useCallback } from 'react';
import { useQuery, generateNodeId } from '@/context/QueryContext';
import { useConnection } from '@/context/ConnectionContext';
import { OperatorSelector } from './OperatorSelector';
import { BooleanGroup } from './BooleanGroup';
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

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-3 rounded-lg',
        'bg-white border border-gray-200',
        'hover:border-gray-300 transition-colors'
      )}
    >
      {/* Field Selector */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 mb-1">
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
      </div>

      {/* Operator Selector */}
      <div className="w-40">
        <label className="block text-xs font-medium text-gray-500 mb-1">
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
        <label className="block text-xs font-medium text-gray-500 mb-1">
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
  );
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
        placeholder="Enter number..."
      />
    );
  }

  // Range query special handling
  if (node.type === 'range') {
    return <RangeValueInput node={node as RangeQueryNode} onChange={onChange} />;
  }

  // Default text input
  return (
    <input
      type="text"
      value={getValue()}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full px-2 py-1.5 text-sm rounded-md',
        'border border-gray-300 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      )}
      placeholder="Enter value..."
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
