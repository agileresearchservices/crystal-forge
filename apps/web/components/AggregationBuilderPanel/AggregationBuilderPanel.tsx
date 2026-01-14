'use client';

import React, { useCallback } from 'react';
import { AggregationBuilder } from '@/components/AggregationsBuilder/AggregationBuilder';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery } from '@/context/QueryContext';
import type { Aggregation } from '@crystal-forge/query-dsl';
import { AlertCircle } from 'lucide-react';

/**
 * Panel component for building aggregations
 * Acts as a standalone aggregation builder panel in the dual-panel layout
 * Integrates with QueryContext for state management
 */
export function AggregationBuilderPanel() {
  const { state: connectionState } = useConnection();
  const { state: queryState, setAggregations } = useQuery();

  // Filter to aggregatable fields
  const aggregatableFields = connectionState.fields.filter(
    (field) =>
      !field.isNested &&
      ['keyword', 'long', 'integer', 'short', 'byte', 'double', 'float', 'date', 'boolean'].includes(
        field.type
      )
  );

  const handleAggregationsChange = useCallback((newAggregations: Aggregation[]) => {
    setAggregations(newAggregations);
  }, [setAggregations]);

  // Show empty state if no connection or fields
  if (!connectionState.connection.isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Connect to OpenSearch
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Connect to an OpenSearch instance to build aggregations
        </p>
      </div>
    );
  }

  if (connectionState.fields.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          No fields available
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          The selected index has no aggregatable fields
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto p-4">
        <AggregationBuilder
          aggregations={queryState.aggregations}
          fields={aggregatableFields}
          onChange={handleAggregationsChange}
        />
      </div>

      {/* Info footer */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400">
        <p>
          {queryState.aggregations.length === 0
            ? 'Add aggregations to analyze your data'
            : `${queryState.aggregations.length} aggregation${queryState.aggregations.length !== 1 ? 's' : ''} defined`}
        </p>
      </div>
    </div>
  );
}

export default AggregationBuilderPanel;
