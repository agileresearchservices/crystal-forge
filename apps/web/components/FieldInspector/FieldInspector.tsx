'use client';

import React, { useEffect, useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { OpenSearchClient } from '@crystal-forge/opensearch-client';
import { Loader2, AlertCircle } from 'lucide-react';

interface FieldInspectorProps {
  fieldName: string;
  fieldType: string;
  indexName?: string;
}

interface FieldStats {
  cardinality?: number;
  sampleValues?: Array<string | number | boolean>;
  min?: number;
  max?: number;
  avg?: number;
  isLoading?: boolean;
  error?: string;
}

/**
 * Displays field information: cardinality, sample values, and statistics
 * Helps developers understand field content before building queries
 */
export function FieldInspector({ fieldName, fieldType, indexName }: FieldInspectorProps) {
  const { state: connectionState } = useConnection();
  const [stats, setStats] = useState<FieldStats>({ isLoading: true });

  // Determine which index to query
  const targetIndex = indexName || connectionState.connection.index;

  useEffect(() => {
    if (!fieldName || !targetIndex || !connectionState.config || !connectionState.connection.isConnected) return;

    const fetchFieldStats = async () => {
      try {
        setStats({ isLoading: true });
        const client = new OpenSearchClient(connectionState.config!);

        // For text/keyword fields: get cardinality and sample values via terms aggregation
        if (fieldType === 'text' || fieldType === 'keyword' || fieldType === 'wildcard') {
          const response = await client.search(targetIndex, {
            size: 0,
            aggs: {
              cardinality: {
                cardinality: { field: fieldName, precision_threshold: 100 },
              },
              samples: {
                terms: { field: fieldName, size: 5 },
              },
            },
          });

          const cardinalityValue = response?.aggregations?.cardinality?.value || 0;
          const samples = response?.aggregations?.samples?.buckets?.map((b: any) => b.key) || [];

          setStats({
            cardinality: cardinalityValue,
            sampleValues: samples,
            isLoading: false,
          });
        }
        // For numeric fields: get stats
        else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'double' || fieldType === 'float') {
          const response = await client.search(targetIndex, {
            size: 0,
            aggs: {
              stats: {
                stats: { field: fieldName },
              },
            },
          });

          const statsData = response?.aggregations?.stats as any;
          setStats({
            min: typeof statsData?.min === 'number' ? statsData.min : undefined,
            max: typeof statsData?.max === 'number' ? statsData.max : undefined,
            avg: typeof statsData?.avg === 'number' ? statsData.avg : undefined,
            cardinality: typeof statsData?.count === 'number' ? statsData.count : undefined,
            isLoading: false,
          });
        }
        // For date fields: get min/max dates
        else if (fieldType === 'date') {
          const response = await client.search(targetIndex, {
            size: 0,
            aggs: {
              min_date: { min: { field: fieldName } },
              max_date: { max: { field: fieldName } },
              cardinality: { cardinality: { field: fieldName, precision_threshold: 100 } },
            },
          });

          const minDateVal = (response?.aggregations?.min_date as any)?.value;
          const maxDateVal = (response?.aggregations?.max_date as any)?.value;
          const cardVal = (response?.aggregations?.cardinality as any)?.value;

          setStats({
            min: typeof minDateVal === 'number' ? minDateVal : undefined,
            max: typeof maxDateVal === 'number' ? maxDateVal : undefined,
            cardinality: typeof cardVal === 'number' ? cardVal : undefined,
            isLoading: false,
          });
        } else {
          setStats({
            cardinality: 0,
            isLoading: false,
            error: 'Stats not available for this field type',
          });
        }
      } catch (error) {
        setStats({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch field stats',
        });
      }
    };

    fetchFieldStats();
  }, [fieldName, fieldType, targetIndex, connectionState.config]);

  if (!fieldName) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
      <div className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{fieldName}</span>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {fieldType}
        </span>
      </div>

      {stats.isLoading ? (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading field information...</span>
        </div>
      ) : stats.error ? (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{stats.error}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Cardinality */}
          {stats.cardinality !== undefined && (
            <div className="text-xs">
              <span className="text-gray-600 dark:text-gray-400">Cardinality: </span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                {stats.cardinality.toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-500 ml-1">unique values</span>
            </div>
          )}

          {/* Sample Values */}
          {stats.sampleValues && stats.sampleValues.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-600 dark:text-gray-400">Sample values:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {stats.sampleValues.slice(0, 3).map((value, idx) => (
                  <code
                    key={idx}
                    className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs break-all max-w-xs"
                  >
                    {String(value).substring(0, 50)}
                    {String(value).length > 50 ? '...' : ''}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Numeric Stats */}
          {(stats.min !== undefined || stats.max !== undefined || stats.avg !== undefined) && (
            <div className="text-xs space-y-1">
              {stats.min !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Min: </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {typeof stats.min === 'number' ? stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 }) : stats.min}
                  </span>
                </div>
              )}
              {stats.avg !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Avg: </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {typeof stats.avg === 'number' ? stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : stats.avg}
                  </span>
                </div>
              )}
              {stats.max !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Max: </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {typeof stats.max === 'number' ? stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 }) : stats.max}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* No stats message */}
          {!stats.sampleValues && !stats.min && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Field information is loading...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FieldInspector;
