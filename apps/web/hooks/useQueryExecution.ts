'use client';

import { useCallback, useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery } from '@/context/QueryContext';
import { useValidation } from '@/context/ValidationContext';
import { serializeQueryState } from '@crystal-forge/query-dsl';
import type { SearchResponse } from '@crystal-forge/opensearch-client';

/**
 * Hook for executing queries against OpenSearch
 * Combines connection and query contexts to execute searches
 */
export function useQueryExecution() {
  const { state: connectionState } = useConnection();
  const { state: queryState, setResults, setLoading, setError } = useQuery();
  const { validateQuery } = useValidation();
  const [localError, setLocalError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    // Validate query before execution
    const validationResult = validateQuery();
    if (!validationResult.isValid) {
      const errorCount = validationResult.errors?.length || 0;
      const errorMessage =
        errorCount === 1
          ? 'Cannot execute query: 1 validation error found. Please fix it.'
          : `Cannot execute query: ${errorCount} validation errors found. Please fix them.`;
      setError(errorMessage);
      setLocalError(errorMessage);
      return;
    }

    // Show warning if there are warnings (but still execute)
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      console.warn(
        `Query has ${validationResult.warnings.length} warning(s):`,
        validationResult.warnings
      );
    }

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
    queryState.query,
    validateQuery,
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
