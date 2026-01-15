'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from './StatCard';

/**
 * Props for AggregationChart
 */
interface AggregationChartProps {
  /** Aggregation name */
  name: string;
  /** Aggregation type (terms, date_histogram, histogram, range, stats, etc.) */
  type: string;
  /** Raw aggregation result from OpenSearch */
  data: unknown;
  /** Optional className */
  className?: string;
  /** Optional dark mode flag */
  isDark?: boolean;
}

/**
 * AggregationChart - Render different chart types based on aggregation type
 * Supports: terms, date_histogram, histogram, range, stats, extended_stats, cardinality, avg, sum, min, max
 */
export function AggregationChart({
  name,
  type,
  data,
  className,
  isDark = false,
}: AggregationChartProps) {
  // Use consistent chart colors (Recharts works better with fixed colors)
  const chartColor = isDark ? '#818cf8' : '#6366f1';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#d1d5db' : '#374151';

  // Render different chart types
  switch (type) {
    case 'terms':
      return <TermsChart name={name} data={data} chartColor={chartColor} gridColor={gridColor} textColor={textColor} />;

    case 'date_histogram':
      return <DateHistogramChart name={name} data={data} chartColor={chartColor} gridColor={gridColor} textColor={textColor} />;

    case 'histogram':
      return <HistogramChart name={name} data={data} chartColor={chartColor} gridColor={gridColor} textColor={textColor} />;

    case 'range':
      return <RangeChart name={name} data={data} chartColor={chartColor} gridColor={gridColor} textColor={textColor} />;

    case 'stats':
      return <StatsChart name={name} data={data} />;

    case 'extended_stats':
      return <ExtendedStatsChart name={name} data={data} />;

    case 'cardinality':
    case 'avg':
    case 'sum':
    case 'min':
    case 'max':
    case 'value_count':
      return <SingleValueChart type={type} data={data} />;

    default:
      return <UnknownAggregationView type={type} data={data} />;
  }
}

/**
 * Terms aggregation - Horizontal bar chart
 */
interface TermsChartProps {
  name: string;
  data: unknown;
  chartColor: string;
  gridColor: string;
  textColor: string;
}

function TermsChart({ name, data, chartColor, gridColor, textColor }: TermsChartProps) {
  const chartData = useMemo(() => {
    const result = data as Record<string, unknown>;
    const buckets = result.buckets as Array<{ key: string; doc_count: number }>;
    if (!buckets || !Array.isArray(buckets)) return [];
    return buckets.map((b) => ({
      key: String(b.key).length > 20 ? String(b.key).substring(0, 17) + '...' : String(b.key),
      doc_count: b.doc_count,
    }));
  }, [data]);

  if (chartData.length === 0) return <EmptyChart />;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis type="number" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis dataKey="key" type="category" tick={{ fill: textColor, fontSize: 11 }} width={140} />
          <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
          <Bar dataKey="doc_count" fill={chartColor} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Date histogram aggregation - Line chart
 */
interface DateHistogramChartProps {
  name: string;
  data: unknown;
  chartColor: string;
  gridColor: string;
  textColor: string;
}

function DateHistogramChart({ name, data, chartColor, gridColor, textColor }: DateHistogramChartProps) {
  const chartData = useMemo(() => {
    const result = data as Record<string, unknown>;
    const buckets = result.buckets as Array<{ key_as_string: string; doc_count: number }>;
    if (!buckets || !Array.isArray(buckets)) return [];
    return buckets.map((b) => ({
      date: new Date(b.key_as_string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: b.doc_count,
    }));
  }, [data]);

  if (chartData.length === 0) return <EmptyChart />;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis tick={{ fill: textColor, fontSize: 12 }} />
          <Tooltip cursor={{ stroke: chartColor, strokeDasharray: '3 3' }} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={chartColor}
            dot={{ fill: chartColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Histogram aggregation - Bar chart
 */
interface HistogramChartProps {
  name: string;
  data: unknown;
  chartColor: string;
  gridColor: string;
  textColor: string;
}

function HistogramChart({ name, data, chartColor, gridColor, textColor }: HistogramChartProps) {
  const chartData = useMemo(() => {
    const result = data as Record<string, unknown>;
    const buckets = result.buckets as Array<{ key: number; doc_count: number }>;
    if (!buckets || !Array.isArray(buckets)) return [];
    return buckets.map((b) => ({
      key: String(b.key),
      count: b.doc_count,
    }));
  }, [data]);

  if (chartData.length === 0) return <EmptyChart />;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="key" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis tick={{ fill: textColor, fontSize: 12 }} />
          <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
          <Bar dataKey="count" fill={chartColor} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Range aggregation - Horizontal bar chart with range labels
 */
interface RangeChartProps {
  name: string;
  data: unknown;
  chartColor: string;
  gridColor: string;
  textColor: string;
}

function RangeChart({ name, data, chartColor, gridColor, textColor }: RangeChartProps) {
  const chartData = useMemo(() => {
    const result = data as Record<string, unknown>;
    const buckets = result.buckets as Array<{ from?: number; to?: number; doc_count: number }>;
    if (!buckets || !Array.isArray(buckets)) return [];
    return buckets.map((b) => {
      let label = '';
      if (b.from !== undefined && b.to !== undefined) {
        label = `${b.from} - ${b.to}`;
      } else if (b.from !== undefined) {
        label = `${b.from}+`;
      } else if (b.to !== undefined) {
        label = `< ${b.to}`;
      }
      return { label, count: b.doc_count };
    });
  }, [data]);

  if (chartData.length === 0) return <EmptyChart />;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis type="number" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis dataKey="label" type="category" tick={{ fill: textColor, fontSize: 11 }} width={70} />
          <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
          <Bar dataKey="count" fill={chartColor} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Stats aggregation - Grid of stat cards
 */
interface StatsChartProps {
  name: string;
  data: unknown;
}

function StatsChart({ name, data }: StatsChartProps) {
  const stats = data as Record<string, number>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.count !== undefined && (
        <StatCard title="Count" value={stats.count} variant="default" />
      )}
      {stats.min !== undefined && (
        <StatCard title="Min" value={typeof stats.min === 'number' ? stats.min.toFixed(2) : stats.min} variant="default" />
      )}
      {stats.max !== undefined && (
        <StatCard title="Max" value={typeof stats.max === 'number' ? stats.max.toFixed(2) : stats.max} variant="default" />
      )}
      {stats.avg !== undefined && (
        <StatCard title="Average" value={typeof stats.avg === 'number' ? stats.avg.toFixed(2) : stats.avg} variant="default" />
      )}
      {stats.sum !== undefined && (
        <StatCard title="Sum" value={typeof stats.sum === 'number' ? stats.sum.toFixed(2) : stats.sum} variant="success" />
      )}
    </div>
  );
}

/**
 * Extended stats aggregation - Stat cards with additional metrics
 */
interface ExtendedStatsChartProps {
  name: string;
  data: unknown;
}

function ExtendedStatsChart({ name, data }: ExtendedStatsChartProps) {
  const stats = data as Record<string, number>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.count !== undefined && (
        <StatCard title="Count" value={stats.count} variant="default" />
      )}
      {stats.min !== undefined && (
        <StatCard title="Min" value={typeof stats.min === 'number' ? stats.min.toFixed(2) : stats.min} variant="default" />
      )}
      {stats.max !== undefined && (
        <StatCard title="Max" value={typeof stats.max === 'number' ? stats.max.toFixed(2) : stats.max} variant="default" />
      )}
      {stats.avg !== undefined && (
        <StatCard title="Average" value={typeof stats.avg === 'number' ? stats.avg.toFixed(2) : stats.avg} variant="default" />
      )}
      {stats.sum !== undefined && (
        <StatCard title="Sum" value={typeof stats.sum === 'number' ? stats.sum.toFixed(2) : stats.sum} variant="success" />
      )}
      {stats.std_deviation !== undefined && (
        <StatCard title="Std Dev" value={typeof stats.std_deviation === 'number' ? stats.std_deviation.toFixed(2) : stats.std_deviation} variant="warning" />
      )}
      {stats.variance !== undefined && (
        <StatCard title="Variance" value={typeof stats.variance === 'number' ? stats.variance.toFixed(2) : stats.variance} variant="warning" />
      )}
    </div>
  );
}

/**
 * Single value aggregation (cardinality, avg, sum, min, max, value_count)
 */
interface SingleValueChartProps {
  type: string;
  data: unknown;
}

function SingleValueChart({ type, data }: SingleValueChartProps) {
  const value = (data as Record<string, number>).value ?? 0;

  const typeMap: Record<string, { title: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
    cardinality: { title: 'Unique Values', variant: 'default' },
    avg: { title: 'Average', variant: 'default' },
    sum: { title: 'Sum', variant: 'success' },
    min: { title: 'Minimum', variant: 'default' },
    max: { title: 'Maximum', variant: 'default' },
    value_count: { title: 'Count', variant: 'default' },
  };

  const { title, variant } = typeMap[type] || { title: type.toUpperCase(), variant: 'default' as const };

  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="w-full max-w-xs">
        <StatCard
          title={title}
          value={typeof value === 'number' ? value.toFixed(2) : value}
          variant={variant}
        />
      </div>
    </div>
  );
}

/**
 * Empty chart placeholder
 */
function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">No data to display</p>
    </div>
  );
}

/**
 * Unknown aggregation type placeholder
 */
interface UnknownAggregationViewProps {
  type: string;
  data: unknown;
}

function UnknownAggregationView({ type, data }: UnknownAggregationViewProps) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
        Unknown aggregation type: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-indigo-600 dark:text-indigo-400">{type}</code>
      </p>
      <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-64 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default AggregationChart;
