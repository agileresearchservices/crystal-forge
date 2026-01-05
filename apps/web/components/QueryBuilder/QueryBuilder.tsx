'use client';

import React, { useCallback } from 'react';
import { useQuery, createEmptyBoolQuery, generateNodeId } from '@/context/QueryContext';
import { useQueryExecution } from '@/hooks/useQueryExecution';
import { BooleanGroup } from './BooleanGroup';
import { QueryNodeComponent } from './QueryNode';
import { Button } from '@/components/ui/button';
import type { BoolQueryNode, MatchQueryNode, QueryNode } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

/**
 * Main query builder container component
 * Manages the visual query building interface
 */
export function QueryBuilder() {
  const { state, addNode, setQuery, resetQuery } = useQuery();
  const { executeQuery, isLoading, canExecute } = useQueryExecution();

  const { query } = state;
  const rootNode = query.query;

  /**
   * Add a new bool query at the root level
   */
  const handleAddBoolQuery = useCallback(() => {
    const boolQuery = createEmptyBoolQuery();
    setQuery(boolQuery);
  }, [setQuery]);

  /**
   * Add a simple match query at the root level
   */
  const handleAddSimpleQuery = useCallback(() => {
    const matchQuery: MatchQueryNode = {
      id: generateNodeId(),
      type: 'match',
      field: '',
      value: '',
    };

    if (!rootNode) {
      // Create a bool query wrapper
      const boolQuery = createEmptyBoolQuery();
      boolQuery.must.push(matchQuery);
      setQuery(boolQuery);
    } else if (rootNode.type === 'bool') {
      addNode(['must'], matchQuery);
    }
  }, [rootNode, setQuery, addNode]);

  /**
   * Handle query reset
   */
  const handleReset = useCallback(() => {
    resetQuery();
  }, [resetQuery]);

  /**
   * Handle query execution
   */
  const handleExecute = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 gap-3 sm:gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Query Builder</h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleReset}
            aria-label="Reset query to empty state"
            variant="outline"
            size="default"
            className="flex-1 sm:flex-none"
          >
            Reset
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!canExecute || isLoading}
            aria-label={isLoading ? 'Executing query' : 'Execute query against OpenSearch'}
            aria-busy={isLoading}
            size="default"
            className="flex-1 sm:flex-none justify-center"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isLoading ? 'Executing...' : 'Execute Query'}
          </Button>
        </div>
      </div>

      {/* Query Tree */}
      <div className="flex-1 overflow-auto p-4" role="main" aria-label="Query builder interface">
        {rootNode ? (
          <div className="space-y-4">
            {rootNode.type === 'bool' ? (
              <BooleanGroup node={rootNode as BoolQueryNode} path={[]} />
            ) : (
              <QueryNodeComponent
                node={rootNode}
                path={[]}
                onRemove={() => setQuery(null)}
              />
            )}
          </div>
        ) : (
          <EmptyState
            onAddBoolQuery={handleAddBoolQuery}
            onAddSimpleQuery={handleAddSimpleQuery}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Empty state shown when no query exists
 */
interface EmptyStateProps {
  onAddBoolQuery: () => void;
  onAddSimpleQuery: () => void;
}

function EmptyState({ onAddBoolQuery, onAddSimpleQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center" role="status" aria-live="polite">
      <div className="text-gray-700 dark:text-gray-400 mb-4">
        <svg
          className="w-16 h-16 mx-auto mb-2 text-gray-400 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">No query defined</p>
        <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">Start building your query by adding a clause</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button
          onClick={onAddBoolQuery}
          aria-label="Create a new boolean query with multiple clauses"
          size="default"
          className="flex-1"
        >
          Add Bool Query
        </Button>
        <Button
          onClick={onAddSimpleQuery}
          aria-label="Create a simple single field query"
          variant="outline"
          size="default"
          className="flex-1"
        >
          Add Simple Query
        </Button>
      </div>
    </div>
  );
}

export default QueryBuilder;
