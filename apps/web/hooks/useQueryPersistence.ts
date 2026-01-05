'use client';

import { useCallback } from 'react';
import debounce from 'lodash.debounce';
import type { QueryState } from '@crystal-forge/query-dsl';

const STORAGE_KEY = 'crystal-forge-query-state';
const DEBOUNCE_DELAY = 500; // ms

/**
 * Hook to persist and restore query state from localStorage
 *
 * Features:
 * - Load query state from localStorage
 * - Save query state with debounced auto-save
 * - Clear persisted state
 * - Graceful error handling for quota exceeded and corrupted data
 */
export function useQueryPersistence() {
  /**
   * Load query state from localStorage
   */
  const loadQueryState = useCallback((): QueryState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as QueryState;

      // Validate basic structure
      if (typeof parsed !== 'object') return null;

      return parsed;
    } catch (error) {
      console.error('Failed to load query state from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore removal errors
      }
      return null;
    }
  }, []);

  /**
   * Save query state to localStorage (debounced)
   */
  const saveQueryState = useCallback(
    debounce((state: QueryState) => {
      try {
        // Only persist specific fields (not results, not connection info)
        const persistentState: QueryState = {
          query: state.query,
          size: state.size,
          from: state.from,
          sort: state.sort,
          highlight: state.highlight,
          suggest: state.suggest,
          timeout: state.timeout,
          explain: state.explain,
          _source: state._source,
          track_total_hits: state.track_total_hits,
          min_score: state.min_score,
        };

        const json = JSON.stringify(persistentState);
        localStorage.setItem(STORAGE_KEY, json);
      } catch (error) {
        // Handle quota exceeded or other storage errors
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded. Cannot save query state.');
        } else {
          console.error('Failed to save query state to localStorage:', error);
        }
      }
    }, DEBOUNCE_DELAY),
    []
  );

  /**
   * Clear persisted query state
   */
  const clearQueryState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear query state from localStorage:', error);
    }
  }, []);

  return {
    loadQueryState,
    saveQueryState,
    clearQueryState,
  };
}
