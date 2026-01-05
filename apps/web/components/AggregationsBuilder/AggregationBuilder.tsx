'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Aggregation, AggregationType } from '@crystal-forge/query-dsl';
import type { FieldInfo } from '@crystal-forge/opensearch-client';
import { AggregationParameterForm } from './AggregationParameterForm';

/**
 * Props for AggregationBuilder
 */
interface AggregationBuilderProps {
  aggregations?: Aggregation[];
  fields: FieldInfo[];
  onChange: (aggregations: Aggregation[]) => void;
}

/**
 * Visual builder for OpenSearch aggregations
 * Allows adding, editing, and removing aggregations with type-specific parameter forms
 */
export function AggregationBuilder({
  aggregations = [],
  fields,
  onChange,
}: AggregationBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter to aggregatable fields
  const aggregatableFields = fields.filter(
    (field) =>
      !field.isNested &&
      ['keyword', 'long', 'integer', 'short', 'byte', 'double', 'float', 'date', 'boolean'].includes(
        field.type
      )
  );

  /**
   * Add a new aggregation
   */
  const handleAddAggregation = useCallback(
    (type: AggregationType) => {
      const newId = `agg-${Date.now()}`;
      const defaultField = aggregatableFields[0]?.path || '';
      const newAgg: Aggregation = {
        name: `${type}_aggregation`,
        type,
        field: defaultField,
      } as Aggregation;

      onChange([...aggregations, newAgg]);
      setExpandedId(newId);
    },
    [aggregations, onChange, aggregatableFields]
  );

  /**
   * Update an aggregation
   */
  const handleUpdateAggregation = useCallback(
    (index: number, updated: Aggregation) => {
      const newAggs = [...aggregations];
      newAggs[index] = updated;
      onChange(newAggs);
    },
    [aggregations, onChange]
  );

  /**
   * Remove an aggregation
   */
  const handleRemoveAggregation = useCallback(
    (index: number) => {
      onChange(aggregations.filter((_, i) => i !== index));
    },
    [aggregations, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Add Aggregation Dropdown */}
      <AggregationTypeSelector onSelect={handleAddAggregation} />

      {/* Aggregations List */}
      {aggregations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg
            className="w-10 h-10 text-gray-400 dark:text-gray-600 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            No aggregations yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click the button above to add your first aggregation
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {aggregations.map((agg, index) => (
            <AggregationItem
              key={`${agg.name}-${index}`}
              aggregation={agg}
              fields={aggregatableFields}
              isExpanded={expandedId === `${agg.name}-${index}`}
              onToggleExpand={() =>
                setExpandedId(
                  expandedId === `${agg.name}-${index}`
                    ? null
                    : `${agg.name}-${index}`
                )
              }
              onUpdate={(updated) => handleUpdateAggregation(index, updated)}
              onRemove={() => handleRemoveAggregation(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Aggregation type selector dropdown
 */
interface AggregationTypeSelectorProps {
  onSelect: (type: AggregationType) => void;
}

const AGGREGATION_TYPES: Array<{ type: AggregationType; label: string; description: string }> = [
  {
    type: 'terms',
    label: 'Terms',
    description: 'Group documents by field values',
  },
  {
    type: 'stats',
    label: 'Stats',
    description: 'Calculate count, sum, min, max, avg',
  },
  {
    type: 'extended_stats',
    label: 'Extended Stats',
    description: 'Stats with stddev and percentiles',
  },
  {
    type: 'date_histogram',
    label: 'Date Histogram',
    description: 'Group documents by date intervals',
  },
  {
    type: 'histogram',
    label: 'Histogram',
    description: 'Group numeric values into buckets',
  },
  {
    type: 'range',
    label: 'Range',
    description: 'Custom range bucketing',
  },
  {
    type: 'cardinality',
    label: 'Cardinality',
    description: 'Count unique values (approximate)',
  },
  {
    type: 'avg',
    label: 'Average',
    description: 'Calculate average value',
  },
  {
    type: 'sum',
    label: 'Sum',
    description: 'Calculate sum of values',
  },
  {
    type: 'min',
    label: 'Minimum',
    description: 'Find minimum value',
  },
  {
    type: 'max',
    label: 'Maximum',
    description: 'Find maximum value',
  },
  {
    type: 'value_count',
    label: 'Value Count',
    description: 'Count non-null values',
  },
];

function AggregationTypeSelector({ onSelect }: AggregationTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        variant="outline"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Aggregation
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {AGGREGATION_TYPES.map(({ type, label, description }) => (
              <button
                key={type}
                onClick={() => {
                  onSelect(type);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual aggregation item
 */
interface AggregationItemProps {
  aggregation: Aggregation;
  fields: FieldInfo[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (aggregation: Aggregation) => void;
  onRemove: () => void;
}

function AggregationItem({
  aggregation,
  fields,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: AggregationItemProps) {
  const typeLabel = AGGREGATION_TYPES.find((t) => t.type === aggregation.type)?.label || aggregation.type;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-white">{aggregation.name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
              {typeLabel}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Field: <span className="font-mono">{aggregation.field}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-md text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Remove aggregation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Parameters */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
          <AggregationParameterForm
            aggregation={aggregation}
            fields={fields}
            onChange={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

export default AggregationBuilder;
