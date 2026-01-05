'use client';

import React, { useEffect, useCallback } from 'react';
import { useTemplates } from '@/context/TemplateContext';
import { useQuery } from '@/context/QueryContext';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, AlertCircle } from 'lucide-react';
import type { QueryHistoryEntry } from '@crystal-forge/storage';

/**
 * Props for QueryHistory component
 */
interface QueryHistoryProps {
  limit?: number;
  showHeader?: boolean;
}

/**
 * Component for displaying and managing query execution history
 */
export function QueryHistory({ limit = 10, showHeader = true }: QueryHistoryProps) {
  const { state: templateState, loadRecentHistory, removeHistoryEntry } = useTemplates();
  const { setQuery } = useQuery();

  // Load history on mount
  useEffect(() => {
    loadRecentHistory(limit);
  }, [limit, loadRecentHistory]);

  /**
   * Handle loading a history entry back into the query builder
   */
  const handleLoadHistory = useCallback(
    (entry: QueryHistoryEntry) => {
      try {
        setQuery(entry.query.query);
      } catch (error) {
        console.error('Failed to load history entry:', error);
      }
    },
    [setQuery]
  );

  /**
   * Handle deleting a history entry
   */
  const handleDeleteHistory = useCallback(
    async (entry: QueryHistoryEntry) => {
      try {
        await removeHistoryEntry(entry.id);
      } catch (error) {
        console.error('Failed to delete history entry:', error);
      }
    },
    [removeHistoryEntry]
  );

  /**
   * Format timestamp
   */
  const formatTime = (date: Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Format as date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Query History</h2>
        </div>
      )}

      {/* Error Message */}
      {templateState.error && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{templateState.error}</div>
        </div>
      )}

      {/* Loading State */}
      {templateState.isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {/* Empty State */}
      {!templateState.isLoading && templateState.history.length === 0 && (
        <div className="rounded-md bg-gray-50 p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-600">No query history yet</p>
          <p className="text-sm text-gray-500 mt-1">Execute a query to see it appear here</p>
        </div>
      )}

      {/* History List */}
      {!templateState.isLoading && templateState.history.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {templateState.history.map((entry) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              onLoad={handleLoadHistory}
              onDelete={handleDeleteHistory}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual history entry component
 */
interface HistoryEntryProps {
  entry: QueryHistoryEntry;
  onLoad: (entry: QueryHistoryEntry) => void;
  onDelete: (entry: QueryHistoryEntry) => void;
  formatTime: (date: Date) => string;
}

function HistoryEntry({ entry, onLoad, onDelete, formatTime }: HistoryEntryProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this query from history?')) {
      return;
    }
    try {
      setIsDeleting(true);
      await onDelete(entry);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-indigo-300 hover:shadow-sm transition-all">
      <button
        onClick={() => onLoad(entry)}
        className="flex-1 text-left"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-indigo-600 hover:underline">
              {entry.index_name}
            </span>
            <span className="text-xs text-gray-500">
              {entry.result_count} result{entry.result_count !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {formatTime(entry.timestamp)}
          </p>
        </div>
      </button>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Delete from history"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
