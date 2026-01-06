'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@/context/QueryContext';
import type { SearchHit } from '@crystal-forge/opensearch-client';
import { cn } from '@/lib/utils';

/**
 * Tab types for results panel
 */
type ResultTab = 'hits' | 'metadata';

/**
 * Props for ResultsPanel
 */
interface ResultsPanelProps {
  className?: string;
}

/**
 * Display query results with hits and metadata tabs
 */
export function ResultsPanel({ className }: ResultsPanelProps) {
  const { state, setSuggest } = useQuery();
  const { results, isLoading, error } = state;
  const [activeTab, setActiveTab] = useState<ResultTab>('hits');

  const handleApplySuggestion = useCallback(
    (suggesterName: string, suggestedText: string) => {
      // Update the suggester text in QueryContext
      if (!state.query.suggest || !state.query.suggest[suggesterName]) return;

      const updatedSuggest = {
        ...state.query.suggest,
        [suggesterName]: {
          ...state.query.suggest[suggesterName],
          text: suggestedText,
        },
      };
      setSuggest(updatedSuggest);
    },
    [state.query.suggest, setSuggest]
  );

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Results</h2>
        {results && (
          <span className="text-xs text-gray-700 dark:text-gray-400" aria-live="polite">
            {results.hits.total.value.toLocaleString()} hits
            {results.hits.total.relation === 'gte' && '+'}
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
            <svg
              className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Executing query...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex-1 p-4" role="alert">
          <div className="p-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <div className="font-semibold mb-1">Query Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center" role="status">
          <div className="text-center space-y-3 max-w-sm px-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">No results yet</p>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 mt-1">Build a query and execute it to see the results from your OpenSearch index</p>
            </div>
          </div>
        </div>
      )}

      {/* Results display */}
      {results && !isLoading && (
        <>
          {/* "Did You Mean?" banner for zero results with suggestions */}
          {results.hits.total.value === 0 && results.suggest && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Did you mean:
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(results.suggest).map(([name, suggestionArray]) =>
                  suggestionArray.flatMap((suggestion) =>
                    suggestion.options.map((option, idx) => (
                      <button
                        key={`${name}-${idx}`}
                        onClick={() => handleApplySuggestion(name, option.text)}
                        className="px-3 py-1.5 text-sm rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-600"
                        title={`Score: ${option.score.toFixed(2)}${option.freq ? ` | Freq: ${option.freq}` : ''}`}
                      >
                        {option.highlighted ? (
                          <span dangerouslySetInnerHTML={{ __html: option.highlighted }} />
                        ) : (
                          option.text
                        )}
                      </button>
                    ))
                  )
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div
            className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            role="tablist"
            aria-label="Results view options"
          >
            <button
              onClick={() => setActiveTab('hits')}
              role="tab"
              aria-selected={activeTab === 'hits'}
              aria-controls="hits-panel"
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
                activeTab === 'hits'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              )}
            >
              Hits ({results.hits.hits.length})
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              role="tab"
              aria-selected={activeTab === 'metadata'}
              aria-controls="metadata-panel"
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
                activeTab === 'metadata'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              )}
            >
              Metadata
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'hits' ? (
              <div id="hits-panel" role="tabpanel">
                <HitsView hits={results.hits.hits} />
              </div>
            ) : (
              <div id="metadata-panel" role="tabpanel">
                <MetadataView
                  took={results.took}
                  timedOut={results.timed_out}
                  shards={results._shards}
                  total={results.hits.total}
                  maxScore={results.hits.max_score}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Hits table view
 */
interface HitsViewProps {
  hits: SearchHit[];
}

function HitsView({ hits }: HitsViewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  /**
   * Toggle row expansion
   */
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (hits.length === 0) {
    return (
      <div className="p-6" role="status">
        <div className="text-center mb-6">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-3"
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
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            No matching documents found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your query executed successfully but returned zero results.
          </p>
        </div>

        {/* Common reasons for empty results - educational content */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Common reasons for empty results
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5" aria-hidden="true">1.</span>
              <span>
                <strong>Wrong query type:</strong> Using &quot;term&quot; on a text field? Try &quot;match&quot; instead.
                Using &quot;match&quot; on a keyword field? Try &quot;term&quot;.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5" aria-hidden="true">2.</span>
              <span>
                <strong>Case sensitivity:</strong> &quot;term&quot; queries are case-sensitive.
                &quot;Active&quot; won&apos;t match &quot;active&quot;.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5" aria-hidden="true">3.</span>
              <span>
                <strong>Date format:</strong> Use ISO 8601 format: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">2024-01-15</code> or
                date math: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">now-7d</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5" aria-hidden="true">4.</span>
              <span>
                <strong>Field name:</strong> Check that the field exists in your index mapping.
                Use the field list on the left to see available fields.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5" aria-hidden="true">5.</span>
              <span>
                <strong>Typos:</strong> Try using a &quot;fuzzy&quot; query to match similar terms.
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {hits.map((hit, index) => (
        <div key={hit._id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          {/* Hit header */}
          <button
            className="w-full flex items-center gap-3 cursor-pointer -mx-3 px-3 py-1 text-left rounded focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => toggleRow(hit._id)}
            aria-expanded={expandedRows.has(hit._id)}
            aria-controls={`hit-content-${hit._id}`}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 w-6 flex-shrink-0">{index + 1}</span>
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
              {hit._id}
            </span>
            {hit._score !== null && (
              <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
                Score: {hit._score.toFixed(4)}
              </span>
            )}
            <svg
              className={cn(
                'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0',
                expandedRows.has(hit._id) && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Expanded content */}
          {expandedRows.has(hit._id) && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md" id={`hit-content-${hit._id}`}>
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-64 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                {JSON.stringify(hit._source, null, 2)}
              </pre>

              {/* Highlight */}
              {hit.highlight && Object.keys(hit.highlight).length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900">
                  <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    Highlighted Fields
                  </h4>
                  {Object.entries(hit.highlight).map(([field, fragments]) => (
                    <div key={field} className="mb-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                      <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-0.5">
                        {field}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        {(fragments as string[]).map((fragment, idx) => (
                          <div
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: fragment }}
                            className="leading-relaxed"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Metadata view
 */
interface MetadataViewProps {
  took: number;
  timedOut: boolean;
  shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  total: {
    value: number;
    relation: 'eq' | 'gte';
  };
  maxScore: number | null;
}

function MetadataView({ took, timedOut, shards, total, maxScore }: MetadataViewProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Timing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Query Time</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{took}ms</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Timed Out</div>
          <div className={cn(
            'text-lg font-semibold',
            timedOut ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          )}>
            {timedOut ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Total hits */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Total Hits</div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {total.value.toLocaleString()}
          {total.relation === 'gte' && (
            <span className="text-sm text-gray-600 dark:text-gray-400 font-normal ml-1">
              or more
            </span>
          )}
        </div>
      </div>

      {/* Max score */}
      {maxScore !== null && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Max Score</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {maxScore.toFixed(4)}
          </div>
        </div>
      )}

      {/* Shard info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Shards</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {shards.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
              {shards.successful}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Successful</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {shards.skipped}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Skipped</div>
          </div>
          <div>
            <div className={cn(
              'text-sm font-semibold',
              shards.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            )}>
              {shards.failed}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPanel;
