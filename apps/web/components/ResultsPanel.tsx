'use client';

import React, { useState, useMemo } from 'react';
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
  const { state } = useQuery();
  const { results, isLoading, error } = state;
  const [activeTab, setActiveTab] = useState<ResultTab>('hits');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium text-gray-700">Results</h3>
        {results && (
          <span className="text-xs text-gray-500">
            {results.hits.total.value.toLocaleString()} hits
            {results.hits.total.relation === 'gte' && '+'}
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
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
        <div className="flex-1 p-4">
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            <div className="font-medium mb-1">Query Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No results yet</p>
            <p className="text-xs text-gray-400">Execute a query to see results</p>
          </div>
        </div>
      )}

      {/* Results display */}
      {results && !isLoading && (
        <>
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('hits')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'hits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Hits ({results.hits.hits.length})
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'metadata'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Metadata
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'hits' ? (
              <HitsView hits={results.hits.hits} />
            ) : (
              <MetadataView
                took={results.took}
                timedOut={results.timed_out}
                shards={results._shards}
                total={results.hits.total}
                maxScore={results.hits.max_score}
              />
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
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-sm">No matching documents found</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {hits.map((hit, index) => (
        <div key={hit._id} className="p-3">
          {/* Hit header */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-1"
            onClick={() => toggleRow(hit._id)}
          >
            <span className="text-xs text-gray-400 w-6">{index + 1}</span>
            <span className="text-sm font-mono text-gray-600 truncate flex-1">
              {hit._id}
            </span>
            {hit._score !== null && (
              <span className="text-xs text-gray-400">
                Score: {hit._score.toFixed(4)}
              </span>
            )}
            <svg
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expandedRows.has(hit._id) && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Expanded content */}
          {expandedRows.has(hit._id) && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(hit._source, null, 2)}
              </pre>

              {/* Highlight */}
              {hit.highlight && Object.keys(hit.highlight).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Highlighted Fields
                  </div>
                  {Object.entries(hit.highlight).map(([field, fragments]) => (
                    <div key={field} className="mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        {field}:
                      </span>
                      <div
                        className="text-xs text-gray-700 mt-1"
                        dangerouslySetInnerHTML={{
                          __html: (fragments as string[]).join(' ... '),
                        }}
                      />
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
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500 mb-1">Query Time</div>
          <div className="text-lg font-semibold text-gray-900">{took}ms</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500 mb-1">Timed Out</div>
          <div className={cn(
            'text-lg font-semibold',
            timedOut ? 'text-red-600' : 'text-green-600'
          )}>
            {timedOut ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Total hits */}
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="text-xs text-gray-500 mb-1">Total Hits</div>
        <div className="text-lg font-semibold text-gray-900">
          {total.value.toLocaleString()}
          {total.relation === 'gte' && (
            <span className="text-sm text-gray-500 font-normal ml-1">
              or more
            </span>
          )}
        </div>
      </div>

      {/* Max score */}
      {maxScore !== null && (
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500 mb-1">Max Score</div>
          <div className="text-lg font-semibold text-gray-900">
            {maxScore.toFixed(4)}
          </div>
        </div>
      )}

      {/* Shard info */}
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="text-xs text-gray-500 mb-2">Shards</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {shards.total}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-green-600">
              {shards.successful}
            </div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-600">
              {shards.skipped}
            </div>
            <div className="text-xs text-gray-500">Skipped</div>
          </div>
          <div>
            <div className={cn(
              'text-sm font-semibold',
              shards.failed > 0 ? 'text-red-600' : 'text-gray-600'
            )}>
              {shards.failed}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPanel;
