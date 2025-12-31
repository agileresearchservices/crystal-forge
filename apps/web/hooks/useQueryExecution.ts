'use client';

import { useCallback, useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery } from '@/context/QueryContext';
import { serializeQueryState } from '@crystal-forge/query-dsl';
import type { SearchResponse } from '@crystal-forge/opensearch-client';

/**
 * Hook for executing queries against OpenSearch
 * Combines connection and query contexts to execute searches
 */
export function useQueryExecution() {
  const { state: connectionState } = useConnection();
  const { state: queryState, setResults, setLoading, setError } = useQuery();
  const [localError, setLocalError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    // Validate connection
    if (!connectionState.connection.isConnected) {
      const error = 'Not connected to OpenSearch';
      setError(error);
      setLocalError(error);
      return;
    }

    if (!connectionState.connection.index) {
      const error = 'No index selected';
      setError(error);
      setLocalError(error);
      return;
    }

    if (!connectionState.config) {
      const error = 'Connection configuration not available';
      setError(error);
      setLocalError(error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      // Serialize the query state to OpenSearch format
      const serializedQuery = serializeQueryState(queryState.query);

      // Execute the query via API
      const response = await fetch('/api/opensearch/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: connectionState.config,
          index: connectionState.connection.index,
          query: serializedQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Query execution failed');
      }

      setResults(data.results as SearchResponse);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Query execution failed';
      setError(errorMessage);
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    connectionState.connection.isConnected,
    connectionState.connection.index,
    connectionState.config,
    queryState.query,
    setResults,
    setLoading,
    setError,
  ]);

  return {
    executeQuery,
    isLoading: queryState.isLoading,
    error: localError || queryState.error,
    canExecute:
      connectionState.connection.isConnected &&
      !!connectionState.connection.index,
  };
}
