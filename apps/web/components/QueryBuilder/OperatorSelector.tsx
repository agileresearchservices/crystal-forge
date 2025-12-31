'use client';

import React, { useMemo } from 'react';
import {
  getOperatorsForFieldType,
  type FieldType,
  type QueryType,
  type OperatorDefinition,
} from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

/**
 * Props for OperatorSelector
 */
interface OperatorSelectorProps {
  /** The field type to get operators for */
  fieldType: FieldType;
  /** Current selected operator/query type */
  value: QueryType;
  /** Callback when operator changes */
  onChange: (queryType: QueryType) => void;
  /** Additional class names */
  className?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Dropdown for selecting query operator based on field type
 */
export function OperatorSelector({
  fieldType,
  value,
  onChange,
  className,
  disabled = false,
}: OperatorSelectorProps) {
  /**
   * Get available operators for the current field type
   */
  const operators = useMemo(() => {
    return getOperatorsForFieldType(fieldType);
  }, [fieldType]);

  /**
   * Get unique operators (by query type)
   * Some operators have the same query type but different labels
   */
  const uniqueOperators = useMemo(() => {
    const seen = new Set<QueryType>();
    const unique: OperatorDefinition[] = [];

    for (const op of operators) {
      if (!seen.has(op.queryType)) {
        seen.add(op.queryType);
        unique.push(op);
      }
    }

    return unique;
  }, [operators]);

  /**
   * Find the current operator definition
   */
  const currentOperator = useMemo(() => {
    return operators.find((op: OperatorDefinition) => op.queryType === value);
  }, [operators, value]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as QueryType)}
      disabled={disabled}
      className={cn(
        'w-full px-2 py-1.5 text-sm rounded-md',
        'border border-gray-300 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      title={currentOperator?.description}
    >
      {uniqueOperators.map((op) => (
        <option key={op.queryType} value={op.queryType} title={op.description}>
          {op.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Alternative view as a button group (for visual variety)
 */
interface OperatorButtonGroupProps {
  fieldType: FieldType;
  value: QueryType;
  onChange: (queryType: QueryType) => void;
  className?: string;
}

export function OperatorButtonGroup({
  fieldType,
  value,
  onChange,
  className,
}: OperatorButtonGroupProps) {
  const operators = useMemo(() => {
    const ops = getOperatorsForFieldType(fieldType);
    // Dedupe by query type
    const seen = new Set<QueryType>();
    return ops.filter((op: OperatorDefinition) => {
      if (seen.has(op.queryType)) return false;
      seen.add(op.queryType);
      return true;
    });
  }, [fieldType]);

  // Only show button group for small number of operators
  if (operators.length > 5) {
    return (
      <OperatorSelector
        fieldType={fieldType}
        value={value}
        onChange={onChange}
        className={className}
      />
    );
  }

  return (
    <div className={cn('inline-flex rounded-md shadow-sm', className)}>
      {operators.map((op: OperatorDefinition, index: number) => (
        <button
          key={op.queryType}
          type="button"
          onClick={() => onChange(op.queryType)}
          title={op.description}
          className={cn(
            'px-3 py-1.5 text-sm font-medium',
            'border border-gray-300',
            index === 0 && 'rounded-l-md',
            index === operators.length - 1 && 'rounded-r-md',
            index > 0 && '-ml-px',
            value === op.queryType
              ? 'bg-blue-50 text-blue-700 border-blue-500 z-10'
              : 'bg-white text-gray-700 hover:bg-gray-50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10'
          )}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

export default OperatorSelector;
