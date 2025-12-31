'use client';

import React, { useCallback } from 'react';
import { useQuery, createEmptyBoolQuery, generateNodeId } from '@/context/QueryContext';
import { useQueryExecution } from '@/hooks/useQueryExecution';
import { BooleanGroup } from './BooleanGroup';
import { QueryNodeComponent } from './QueryNode';
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Query Builder</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md',
              'border border-gray-300 hover:bg-gray-50',
              'transition-colors'
            )}
          >
            Reset
          </button>
          <button
            onClick={handleExecute}
            disabled={!canExecute || isLoading}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md',
              'bg-blue-600 text-white hover:bg-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isLoading ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      </div>

      {/* Query Tree */}
      <div className="flex-1 overflow-auto p-4">
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
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-gray-500 mb-4">
        <svg
          className="w-16 h-16 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-lg font-medium">No query defined</p>
        <p className="text-sm">Start building your query by adding a clause</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAddBoolQuery}
          className={cn(
            'px-4 py-2 text-sm rounded-md',
            'bg-blue-600 text-white hover:bg-blue-700',
            'transition-colors'
          )}
        >
          Add Bool Query
        </button>
        <button
          onClick={onAddSimpleQuery}
          className={cn(
            'px-4 py-2 text-sm rounded-md',
            'border border-gray-300 hover:bg-gray-50',
            'transition-colors'
          )}
        >
          Add Simple Query
        </button>
      </div>
    </div>
  );
}

export default QueryBuilder;
