'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery, generateNodeId } from '@/context/QueryContext';
import { useDebounce } from '@/hooks/useDebounce';
import { serializeQuery } from '@crystal-forge/query-dsl';
import type { FieldInfo } from '@crystal-forge/opensearch-client';
import type {
  TermsAggregationResult,
  StatsAggregationResult,
  DateHistogramAggregationResult,
  TermQueryNode,
  RangeQueryNode,
} from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

type AggregationResultType =
  | TermsAggregationResult
  | StatsAggregationResult
  | DateHistogramAggregationResult;

interface AggregationState {
  loading: boolean;
  error: string | null;
  result: AggregationResultType | null;
  aggregationType: string | null;
}

/**
 * Panel for exploring field values via aggregations
 */
export function AggregationsPanel() {
  const { state: connectionState } = useConnection();
  const { state: queryState, addNode } = useQuery();
  const [selectedField, setSelectedField] = useState<FieldInfo | null>(null);

  // Debounce the query to avoid too many requests on rapid changes
  const queryJson = useMemo(
    () => (queryState.query.query ? JSON.stringify(serializeQuery(queryState.query.query)) : null),
    [queryState.query.query]
  );
  const debouncedQueryJson = useDebounce(queryJson, 500);

  const [aggState, setAggState] = useState<AggregationState>({
    loading: false,
    error: null,
    result: null,
    aggregationType: null,
  });

  // Filter to aggregatable fields only
  const aggregatableFields = connectionState.fields.filter(
    (field) =>
      !field.isNested &&
      ['keyword', 'long', 'integer', 'short', 'byte', 'double', 'float', 'date', 'boolean'].includes(
        field.type
      )
  );

  /**
   * Fetch aggregation for selected field
   */
  const fetchAggregation = useCallback(async () => {
    if (!selectedField || !connectionState.connection.isConnected) return;

    setAggState({ loading: true, error: null, result: null, aggregationType: null });

    try {
      const response = await fetch('/api/opensearch/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: connectionState.config,
          index: connectionState.connection.index,
          field: selectedField.path,
          fieldType: selectedField.type,
          query: queryState.query.query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch aggregation');
      }

      setAggState({
        loading: false,
        error: null,
        result: data.result,
        aggregationType: data.aggregationType,
      });
    } catch (err) {
      setAggState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch aggregation',
        result: null,
        aggregationType: null,
      });
    }
  }, [selectedField, connectionState, queryState.query.query]);

  // Fetch aggregation when field or query changes (debounced)
  useEffect(() => {
    if (selectedField) {
      fetchAggregation();
    } else {
      setAggState({ loading: false, error: null, result: null, aggregationType: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedField, debouncedQueryJson]);

  /**
   * Add a term filter from bucket click
   */
  const handleAddTermFilter = useCallback(
    (field: string, value: string | number | boolean) => {
      const newNode: TermQueryNode = {
        id: generateNodeId(),
        type: 'term',
        field,
        value,
      };
      addNode(['filter'], newNode);
    },
    [addNode]
  );

  /**
   * Add a range filter from date histogram bucket
   */
  const handleAddDateRangeFilter = useCallback(
    (field: string, from: string, to: string) => {
      const newNode: RangeQueryNode = {
        id: generateNodeId(),
        type: 'range',
        field,
        gte: from,
        lt: to,
      };
      addNode(['filter'], newNode);
    },
    [addNode]
  );

  if (!connectionState.connection.isConnected) {
    return (
      <div className="text-sm text-gray-500">
        <p className="mb-2 font-medium">Field Explorer</p>
        <p>Connect to OpenSearch to explore field values.</p>
      </div>
    );
  }

  if (aggregatableFields.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <p className="mb-2 font-medium">Field Explorer</p>
        <p>No aggregatable fields available.</p>
        <p className="mt-2 text-xs text-gray-400">
          Aggregations require keyword, numeric, date, or boolean fields.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Field to Explore
        </label>
        <select
          value={selectedField?.path || ''}
          onChange={(e) => {
            const field = aggregatableFields.find((f) => f.path === e.target.value);
            setSelectedField(field || null);
          }}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          )}
        >
          <option value="">Choose a field...</option>
          {aggregatableFields.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path} ({field.type})
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {aggState.loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </div>
      )}

      {/* Error state */}
      {aggState.error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {aggState.error}
        </div>
      )}

      {/* Results */}
      {aggState.result && selectedField && (
        <AggregationResults
          field={selectedField}
          result={aggState.result}
          aggregationType={aggState.aggregationType!}
          onAddTermFilter={handleAddTermFilter}
          onAddDateRangeFilter={handleAddDateRangeFilter}
        />
      )}

      {/* Help text */}
      {!selectedField && !aggState.loading && (
        <p className="text-xs text-gray-400">
          Click a value to add it as a filter to your query.
        </p>
      )}
    </div>
  );
}

/**
 * Render aggregation results based on type
 */
interface AggregationResultsProps {
  field: FieldInfo;
  result: AggregationResultType;
  aggregationType: string;
  onAddTermFilter: (field: string, value: string | number | boolean) => void;
  onAddDateRangeFilter: (field: string, from: string, to: string) => void;
}

function AggregationResults({
  field,
  result,
  aggregationType,
  onAddTermFilter,
  onAddDateRangeFilter,
}: AggregationResultsProps) {
  if (aggregationType === 'terms') {
    return (
      <TermsResults
        field={field}
        result={result as TermsAggregationResult}
        onAddFilter={onAddTermFilter}
      />
    );
  }

  if (aggregationType === 'stats') {
    return <StatsResults result={result as StatsAggregationResult} />;
  }

  if (aggregationType === 'date_histogram') {
    return (
      <DateHistogramResults
        field={field}
        result={result as DateHistogramAggregationResult}
        onAddFilter={onAddDateRangeFilter}
      />
    );
  }

  return (
    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

/**
 * Terms aggregation results with clickable buckets
 */
interface TermsResultsProps {
  field: FieldInfo;
  result: TermsAggregationResult;
  onAddFilter: (field: string, value: string | number | boolean) => void;
}

function TermsResults({ field, result, onAddFilter }: TermsResultsProps) {
  const buckets = result.buckets || [];
  const maxCount = Math.max(...buckets.map((b) => b.doc_count), 1);

  if (buckets.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No values found for this field.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 mb-2">
        Top {buckets.length} values ({result.sum_other_doc_count} other)
      </div>
      {buckets.map((bucket) => {
        const percentage = (bucket.doc_count / maxCount) * 100;
        return (
          <button
            key={String(bucket.key)}
            onClick={() => onAddFilter(field.path, bucket.key)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded',
              'text-left text-sm hover:bg-blue-50 transition-colors',
              'group cursor-pointer'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium text-gray-700 group-hover:text-blue-600">
                {bucket.key_as_string ?? String(bucket.key)}
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 group-hover:text-blue-500">
              {bucket.doc_count.toLocaleString()}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Stats aggregation results
 */
interface StatsResultsProps {
  result: StatsAggregationResult;
}

function StatsResults({ result }: StatsResultsProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Count" value={result.count.toLocaleString()} />
        <StatCard label="Min" value={formatNumber(result.min)} />
        <StatCard label="Max" value={formatNumber(result.max)} />
        <StatCard label="Avg" value={formatNumber(result.avg)} />
        <StatCard label="Sum" value={formatNumber(result.sum)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-100 rounded p-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium text-gray-700">{value}</div>
    </div>
  );
}

function formatNumber(value: number | null): string {
  if (value === null) return '-';
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Date histogram results with clickable buckets
 */
interface DateHistogramResultsProps {
  field: FieldInfo;
  result: DateHistogramAggregationResult;
  onAddFilter: (field: string, from: string, to: string) => void;
}

function DateHistogramResults({ field, result, onAddFilter }: DateHistogramResultsProps) {
  const buckets = result.buckets || [];
  const maxCount = Math.max(...buckets.map((b) => b.doc_count), 1);

  if (buckets.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No date values found for this field.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 mb-2">
        {buckets.length} time buckets
      </div>
      {buckets.slice(0, 15).map((bucket, idx) => {
        const percentage = (bucket.doc_count / maxCount) * 100;
        // For next bucket boundary, use next bucket's key or add 1 day
        const nextBucket = buckets[idx + 1];
        const toDate = nextBucket
          ? nextBucket.key_as_string
          : new Date(bucket.key + 86400000).toISOString().split('T')[0];

        return (
          <button
            key={bucket.key}
            onClick={() => onAddFilter(field.path, bucket.key_as_string, toDate)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded',
              'text-left text-sm hover:bg-blue-50 transition-colors',
              'group cursor-pointer'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium text-gray-700 group-hover:text-blue-600">
                {bucket.key_as_string}
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 group-hover:text-green-600">
              {bucket.doc_count.toLocaleString()}
            </div>
          </button>
        );
      })}
      {buckets.length > 15 && (
        <div className="text-xs text-gray-400 pl-2">
          + {buckets.length - 15} more buckets
        </div>
      )}
    </div>
  );
}

export default AggregationsPanel;
