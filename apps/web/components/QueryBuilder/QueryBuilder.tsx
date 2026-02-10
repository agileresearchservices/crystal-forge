'use client';

import React, { useCallback } from 'react';
import { useQuery, createEmptyBoolQuery } from '@/context/QueryContext';
import { useActiveClause, type BoolClause } from '@/context/ActiveClauseContext';
import { BooleanGroup } from './BooleanGroup';
import { QueryNodeComponent } from './QueryNode';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { CLAUSE_TOOLTIPS } from '@/constants/tooltips';
import { EXAMPLE_QUERIES, type ExampleQuery } from '@/constants/example-queries';
import type { BoolQueryNode } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

/**
 * Main query builder container component
 * Manages the visual query building interface
 */
export function QueryBuilder() {
  const { state, setQuery, resetQuery } = useQuery();
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
   * Handle query reset
   */
  const handleReset = useCallback(() => {
    resetQuery();
  }, [resetQuery]);

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
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 gap-3 sm:gap-2">
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
        </div>
      </div>

      {/* Active Clause Indicator */}
      <div className="flex-shrink-0 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-200 dark:border-indigo-800 flex items-center gap-3" aria-live="polite" aria-atomic="true">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Adding fields to:</span>
        <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
          {activeClause.toUpperCase()}
        </span>
        <InfoTooltip
          content={CLAUSE_TOOLTIPS[activeClause as BoolClause]}
          side="right"
          className="flex-shrink-0"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto" role="main" aria-label="Query builder interface">
        <div className="p-4">
          {rootNode ? (
            <div className="space-y-4">
              {rootNode.type === 'bool' ? (
                <BooleanGroup
                  node={rootNode as BoolQueryNode}
                  path={[]}
                />
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
              onLoadExample={handleLoadExample}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state shown when no query exists
 */
interface EmptyStateProps {
  onAddBoolQuery: () => void;
  onLoadExample: (example: ExampleQuery) => void;
}

function EmptyState({ onAddBoolQuery, onLoadExample }: EmptyStateProps) {
  return (
    <div className="flex flex-col h-full py-8 px-4" role="status" aria-live="polite">
      <div className="flex-1 flex flex-col items-center justify-start gap-6 max-w-3xl mx-auto w-full">
        <div className="space-y-2 text-center pt-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Ready to build a query?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Start from scratch or try an example</p>
        </div>

        {/* New Empty Query Button */}
        <Button
          onClick={onAddBoolQuery}
          size="lg"
          className="px-8"
          aria-label="Create a new empty bool query"
        >
          New Empty Query
        </Button>

        {/* Example Queries */}
        <div className="w-full pt-8 border-t border-gray-200 dark:border-gray-700 mt-2 max-w-2xl">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Or try an example to get started:
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
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {example.description}
                </p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
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
