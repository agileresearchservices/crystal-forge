'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  Aggregation,
  TermsAggregation,
  StatsAggregation,
  ExtendedStatsAggregation,
  DateHistogramAggregation,
  HistogramAggregation,
  RangeAggregation,
  CardinalityAggregation,
  AvgAggregation,
  SumAggregation,
  MinAggregation,
  MaxAggregation,
  ValueCountAggregation,
} from '@crystal-forge/query-dsl';
import type { FieldInfo } from '@crystal-forge/opensearch-client';

/**
 * Props for AggregationParameterForm
 */
interface AggregationParameterFormProps {
  aggregation: Aggregation;
  fields: FieldInfo[];
  onChange: (aggregation: Aggregation) => void;
}

/**
 * Dynamic parameter form for aggregations
 * Shows relevant parameters based on aggregation type
 */
export function AggregationParameterForm({
  aggregation,
  fields,
  onChange,
}: AggregationParameterFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string) => {
    onChange({ ...aggregation, field });
  };

  const handleNameChange = (name: string) => {
    onChange({ ...aggregation, name });
  };

  const handlePropertyChange = (key: string, value: any) => {
    onChange({ ...aggregation, [key]: value } as Aggregation);
  };

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Aggregation Name
        </label>
        <input
          type="text"
          value={aggregation.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400'
          )}
          placeholder="e.g., category_breakdown, date_distribution"
        />
      </div>

      {/* Field Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Field
        </label>
        <select
          value={aggregation.field}
          onChange={(e) => handleFieldChange(e.target.value)}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400'
          )}
        >
          <option value="">Select a field...</option>
          {fields.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path} ({field.type})
            </option>
          ))}
        </select>
      </div>

      {/* Type-Specific Parameters */}
      {aggregation.type === 'terms' && (
        <TermsParameters
          agg={aggregation as TermsAggregation}
          onChange={(updates) => handlePropertyChange('size', updates.size)}
        />
      )}

      {aggregation.type === 'date_histogram' && (
        <DateHistogramParameters
          agg={aggregation as DateHistogramAggregation}
          onChange={(updates) => {
            const updated = { ...aggregation, ...updates } as DateHistogramAggregation;
            onChange(updated);
          }}
        />
      )}

      {aggregation.type === 'histogram' && (
        <HistogramParameters
          agg={aggregation as HistogramAggregation}
          onChange={(updates) => {
            const updated = { ...aggregation, ...updates } as HistogramAggregation;
            onChange(updated);
          }}
        />
      )}

      {aggregation.type === 'range' && (
        <RangeParameters
          agg={aggregation as RangeAggregation}
          onChange={(ranges) => {
            const updated = { ...aggregation, ranges } as RangeAggregation;
            onChange(updated);
          }}
        />
      )}

      {aggregation.type === 'cardinality' && (
        <CardinalityParameters
          agg={aggregation as CardinalityAggregation}
          onChange={(threshold) => {
            const updated = { ...aggregation, precision_threshold: threshold } as CardinalityAggregation;
            onChange(updated);
          }}
        />
      )}

      {aggregation.type === 'extended_stats' && (
        <ExtendedStatsParameters
          agg={aggregation as ExtendedStatsAggregation}
          onChange={(sigma) => {
            const updated = { ...aggregation, sigma } as ExtendedStatsAggregation;
            onChange(updated);
          }}
        />
      )}

      {/* Metric aggregations (stats, avg, sum, min, max, value_count) have no additional parameters */}
      {['stats', 'avg', 'sum', 'min', 'max', 'value_count'].includes(aggregation.type) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-700 dark:text-blue-400">
          This aggregation will calculate {aggregation.type === 'value_count' ? 'count of non-null values' : `the ${aggregation.type.toLowerCase()}`} for the selected field.
        </div>
      )}
    </div>
  );
}

/**
 * Terms aggregation parameters
 */
interface TermsParametersProps {
  agg: TermsAggregation;
  onChange: (updates: Partial<TermsAggregation>) => void;
}

function TermsParameters({ agg, onChange }: TermsParametersProps) {
  return (
    <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Number of Buckets (Size)
        </label>
        <input
          type="number"
          value={agg.size || 10}
          onChange={(e) => onChange({ size: Math.max(1, parseInt(e.target.value) || 10) })}
          min="1"
          max="10000"
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Default: 10. Controls how many top terms are returned.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sort Order
        </label>
        <select
          value={agg.order ? JSON.stringify(agg.order) : '_count:desc'}
          onChange={(e) => {
            const [key, direction] = e.target.value.split(':');
            onChange({
              order:
                key === '_count'
                  ? { _count: direction as 'asc' | 'desc' }
                  : { _key: direction as 'asc' | 'desc' },
            });
          }}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        >
          <option value="_count:desc">Count (Descending) - Default</option>
          <option value="_count:asc">Count (Ascending)</option>
          <option value="_key:desc">Key (Descending)</option>
          <option value="_key:asc">Key (Ascending)</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Date histogram parameters
 */
interface DateHistogramParametersProps {
  agg: DateHistogramAggregation;
  onChange: (updates: Partial<DateHistogramAggregation>) => void;
}

function DateHistogramParameters({ agg, onChange }: DateHistogramParametersProps) {
  return (
    <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Calendar Interval
        </label>
        <select
          value={agg.calendar_interval || '1d'}
          onChange={(e) => onChange({ calendar_interval: e.target.value, fixed_interval: undefined })}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        >
          <option value="1M">Month (1M)</option>
          <option value="1w">Week (1w)</option>
          <option value="1d">Day (1d) - Default</option>
          <option value="12h">12 Hours (12h)</option>
          <option value="1h">Hour (1h)</option>
          <option value="1m">Minute (1m)</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Calendar-aware intervals for natural grouping (e.g., days align to midnight)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Timezone
        </label>
        <input
          type="text"
          value={agg.time_zone || ''}
          onChange={(e) => onChange({ time_zone: e.target.value || undefined })}
          placeholder="e.g., America/Los_Angeles"
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Optional. Use IANA timezone identifier.
        </p>
      </div>
    </div>
  );
}

/**
 * Histogram parameters
 */
interface HistogramParametersProps {
  agg: HistogramAggregation;
  onChange: (updates: Partial<HistogramAggregation>) => void;
}

function HistogramParameters({ agg, onChange }: HistogramParametersProps) {
  return (
    <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bucket Interval <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={agg.interval || 10}
          onChange={(e) => onChange({ interval: Math.max(1, parseInt(e.target.value) || 10) })}
          min="1"
          step="1"
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Size of each bucket (e.g., 10, 100, 1000)
        </p>
      </div>
    </div>
  );
}

/**
 * Range parameters
 */
interface RangeParametersProps {
  agg: RangeAggregation;
  onChange: (ranges: RangeAggregation['ranges']) => void;
}

function RangeParameters({ agg, onChange }: RangeParametersProps) {
  const ranges = agg.ranges || [{ from: 0, to: 100 }];

  const updateRange = (index: number, key: 'from' | 'to', value: number) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], [key]: value };
    onChange(newRanges);
  };

  const addRange = () => {
    onChange([...ranges, { from: 0, to: 100 }]);
  };

  const removeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Custom Ranges
      </div>

      {ranges.map((range, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              type="number"
              value={range.from ?? ''}
              onChange={(e) => updateRange(index, 'from', parseFloat(e.target.value))}
              className={cn(
                'w-full px-2 py-1.5 text-sm rounded-md',
                'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="number"
              value={range.to ?? ''}
              onChange={(e) => updateRange(index, 'to', parseFloat(e.target.value))}
              className={cn(
                'w-full px-2 py-1.5 text-sm rounded-md',
                'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500'
              )}
            />
          </div>
          {ranges.length > 1 && (
            <Button
              onClick={() => removeRange(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              Remove
            </Button>
          )}
        </div>
      ))}

      <Button onClick={addRange} variant="outline" size="sm" className="w-full">
        Add Range
      </Button>
    </div>
  );
}

/**
 * Cardinality parameters
 */
interface CardinalityParametersProps {
  agg: CardinalityAggregation;
  onChange: (threshold: number) => void;
}

function CardinalityParameters({ agg, onChange }: CardinalityParametersProps) {
  return (
    <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Precision Threshold
        </label>
        <input
          type="number"
          value={agg.precision_threshold || 100}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 100))}
          min="1"
          max="40000"
          step="100"
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Higher values improve accuracy but use more memory. Default: 100.
        </p>
      </div>
    </div>
  );
}

/**
 * Extended stats parameters
 */
interface ExtendedStatsParametersProps {
  agg: ExtendedStatsAggregation;
  onChange: (sigma: number) => void;
}

function ExtendedStatsParameters({ agg, onChange }: ExtendedStatsParametersProps) {
  return (
    <div className="space-y-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Standard Deviation Bounds (Sigma)
        </label>
        <input
          type="number"
          value={agg.sigma || 2}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 2))}
          min="0"
          step="0.5"
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Number of standard deviations (default: 2). Used for confidence bounds.
        </p>
      </div>
    </div>
  );
}

export default AggregationParameterForm;
