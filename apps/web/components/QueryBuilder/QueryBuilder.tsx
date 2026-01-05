'use client';

import React, { useCallback } from 'react';
import { useQuery, createEmptyBoolQuery, generateNodeId } from '@/context/QueryContext';
import { useQueryExecution } from '@/hooks/useQueryExecution';
import { useActiveClause, type BoolClause } from '@/context/ActiveClauseContext';
import { BooleanGroup } from './BooleanGroup';
import { QueryNodeComponent } from './QueryNode';
import { Button } from '@/components/ui/button';
import { HighlightingPanel } from '@/components/HighlightingPanel/HighlightingPanel';
import { SuggesterPanel } from '@/components/SuggesterPanel/SuggesterPanel';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { CLAUSE_TOOLTIPS } from '@/constants/tooltips';
import { EXAMPLE_QUERIES, type ExampleQuery } from '@/constants/example-queries';
import type { BoolQueryNode, MatchQueryNode, QueryNode } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

/**
 * Main query builder container component
 * Manages the visual query building interface
 */
export function QueryBuilder() {
  const { state, addNode, setQuery, resetQuery } = useQuery();
  const { executeQuery, isLoading, canExecute } = useQueryExecution();
  const { activeClause } = useActiveClause();

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

  /**
   * Load an example query
   */
  const handleLoadExample = useCallback(
    (example: ExampleQuery) => {
      setQuery(example.query);
    },
    [setQuery]
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 gap-3 sm:gap-2">
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

      {/* Active Clause Indicator */}
      <div className="flex-shrink-0 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 flex items-center gap-3" aria-live="polite" aria-atomic="true">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Adding fields to:</span>
        <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 font-semibold text-sm">
          {activeClause.toUpperCase()}
        </span>
        <InfoTooltip
          content={CLAUSE_TOOLTIPS[activeClause as BoolClause]}
          side="right"
          className="flex-shrink-0"
        />
      </div>

      {/* Query Tree */}
      <div className="flex-1 overflow-auto p-4" role="main" aria-label="Query builder interface">
        {/* Highlighting configuration panel */}
        <div className="mb-4">
          <HighlightingPanel />
        </div>

        {/* Suggester configuration panel */}
        <div className="mb-4">
          <SuggesterPanel />
        </div>

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
            onLoadExample={handleLoadExample}
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
  onLoadExample: (example: ExampleQuery) => void;
}

function EmptyState({ onAddBoolQuery, onAddSimpleQuery, onLoadExample }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center py-12 px-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <svg
          className="w-20 h-20 text-gray-300 dark:text-gray-700"
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
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">No query defined</h3>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">Start building your search query by adding a clause. You can create a boolean query with multiple conditions or a simple single-field query.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
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

        {/* Example Queries */}
        <div className="w-full pt-8 border-t border-gray-200 dark:border-gray-800 mt-8 max-w-2xl">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Try an example to get started:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example.id}
                onClick={() => onLoadExample(example)}
                className={cn(
                  'flex flex-col items-start gap-2 p-3 rounded-lg text-left',
                  'border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
                  'hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
                )}
                aria-label={`Load ${example.title} example query`}
              >
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {example.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {example.description}
                </p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                  {example.explanation}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueryBuilder;
