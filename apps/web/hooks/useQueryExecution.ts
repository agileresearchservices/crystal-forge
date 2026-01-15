'use client';

import { useCallback, useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery } from '@/context/QueryContext';
import { serializeQuery } from '@crystal-forge/query-dsl';
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
    // Validation temporarily disabled - will be re-enabled in future update
    // when type alignment issues are resolved between packages

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

    // Validate that at least query or aggregations exist
    if (!queryState.query.query && queryState.aggregations.length === 0) {
      const error = 'No query or aggregations defined';
      setError(error);
      setLocalError(error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      // Serialize the query node to OpenSearch format
      const serializedQuery = queryState.query.query ? serializeQuery(queryState.query.query) : null;

      // Execute the query + aggregations via unified API
      const response = await fetch('/api/opensearch/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: connectionState.config,
          index: connectionState.connection.index,
          query: serializedQuery,
          aggregations: queryState.aggregations,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Failed to parse server response as JSON');
      }

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
    queryState.query.query,
    queryState.aggregations,
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
      !!connectionState.connection.index &&
      (!!queryState.query.query || queryState.aggregations.length > 0),
  };
}
