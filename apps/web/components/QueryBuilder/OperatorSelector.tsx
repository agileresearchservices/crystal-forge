'use client';

import React, { useMemo, useState } from 'react';
import {
  getOperatorsForFieldType,
  type FieldType,
  type QueryType,
  type OperatorDefinition,
} from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { OPERATOR_TOOLTIPS } from '@/constants/tooltips';
import { getComparisonsForOperator } from '@/constants/query-comparisons';
import { ComparisonModal } from '@/components/ComparisonModal/ComparisonModal';
import { HelpCircle } from 'lucide-react';

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
  const [comparisonKey, setComparisonKey] = useState<string | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

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
   * Group operators by recommended status
   */
  const groupedOperators = useMemo(() => {
    const recommended = uniqueOperators.filter((op) => op.isRecommended);
    const other = uniqueOperators.filter((op) => !op.isRecommended);
    return { recommended, other };
  }, [uniqueOperators]);

  /**
   * Find the current operator definition
   */
  const currentOperator = useMemo(() => {
    return operators.find((op: OperatorDefinition) => op.queryType === value);
  }, [operators, value]);

  /**
   * Get relevant comparisons for the current operator
   */
  const relevantComparisons = useMemo(() => {
    return getComparisonsForOperator(value as string);
  }, [value]);

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as QueryType)}
          disabled={disabled}
          className={cn(
            'flex-1 px-2 py-1.5 text-sm rounded-md',
            'border border-gray-300 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          title={currentOperator?.description}
        >
          {groupedOperators.recommended.length > 0 && (
            <optgroup label="Recommended for this field type">
              {groupedOperators.recommended.map((op) => (
                <option key={op.queryType} value={op.queryType} title={op.description}>
                  ⭐ {op.label}
                </option>
              ))}
            </optgroup>
          )}
          {groupedOperators.other.length > 0 && (
            <optgroup label="Other options">
              {groupedOperators.other.map((op) => (
                <option key={op.queryType} value={op.queryType} title={op.description}>
                  {op.label}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Tooltip for current operator */}
        {currentOperator && value in OPERATOR_TOOLTIPS && (
          <InfoTooltip
            content={OPERATOR_TOOLTIPS[value as QueryType]}
            side="right"
            className="flex-shrink-0"
          />
        )}

        {/* Compare button for relevant comparisons */}
        {relevantComparisons.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setComparisonKey(relevantComparisons[0]);
              setIsComparisonOpen(true);
            }}
            title="Compare with similar query types"
            className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors flex-shrink-0"
            aria-label="Compare with similar query types"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comparison Modal */}
      <ComparisonModal
        comparisonKey={comparisonKey}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />
    </>
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

  const currentOp = useMemo(
    () => operators.find((op: OperatorDefinition) => op.queryType === value),
    [operators, value]
  );

  // Group operators for button group
  const groupedOpsForButtons = useMemo(() => {
    const seen = new Set<QueryType>();
    const unique: OperatorDefinition[] = [];

    for (const op of operators) {
      if (!seen.has(op.queryType)) {
        seen.add(op.queryType);
        unique.push(op);
      }
    }

    const recommended = unique.filter((op) => op.isRecommended);
    const other = unique.filter((op) => !op.isRecommended);
    return [...recommended, ...other];
  }, [operators]);

  return (
    <div className="flex items-center gap-2">
      <div className={cn('inline-flex rounded-md shadow-sm', className)}>
        {groupedOpsForButtons.map((op: OperatorDefinition, index: number) => (
          <button
            key={op.queryType}
            type="button"
            onClick={() => onChange(op.queryType)}
            title={op.description}
            className={cn(
              'px-3 py-1.5 text-sm font-medium relative',
              'border border-gray-300',
              index === 0 && 'rounded-l-md',
              index === groupedOpsForButtons.length - 1 && 'rounded-r-md',
              index > 0 && '-ml-px',
              value === op.queryType
                ? 'bg-blue-50 text-blue-700 border-blue-500 z-10'
                : 'bg-white text-gray-700 hover:bg-gray-50',
              op.isRecommended && 'border-indigo-300',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10'
            )}
          >
            {op.label}
            {op.isRecommended && (
              <span className="ml-1" title="Recommended for this field type">
                ⭐
              </span>
            )}
          </button>
        ))}
      </div>
      {currentOp && value in OPERATOR_TOOLTIPS && (
        <InfoTooltip
          content={OPERATOR_TOOLTIPS[value as QueryType]}
          side="right"
          className="flex-shrink-0"
        />
      )}
    </div>
  );
}

export default OperatorSelector;
