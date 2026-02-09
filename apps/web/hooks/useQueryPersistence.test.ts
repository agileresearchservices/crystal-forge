import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useQueryPersistence } from './useQueryPersistence';
import type { QueryState } from '@crystal-forge/query-dsl';

describe('useQueryPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const createMockQueryState = (): QueryState => ({
    query: {
      query: {
        id: 'test-query-1',
        type: 'bool',
        must: [],
        should: [],
        must_not: [],
        filter: [],
      },
      lastModified: new Date().toISOString(),
    },
    aggregations: [],
    results: null,
    isLoading: false,
    error: null,
    size: 10,
    from: 0,
  });

  describe('loadQueryState', () => {
    it('should load query state from localStorage', () => {
      const mockState = createMockQueryState();
      localStorage.setItem('crystal-forge-query-state', JSON.stringify(mockState));

      const { result } = renderHook(() => useQueryPersistence());
      let loaded;

      act(() => {
        loaded = result.current.loadQueryState();
      });

      expect(loaded).toBeTruthy();
      expect(loaded?.query).toEqual(mockState.query);
    });

    it('should return null when no data is stored', () => {
      const { result } = renderHook(() => useQueryPersistence());
      let loaded;

      act(() => {
        loaded = result.current.loadQueryState();
      });

      expect(loaded).toBeNull();
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('crystal-forge-query-state', 'invalid json {{{');

      const { result } = renderHook(() => useQueryPersistence());
      let loaded;

      act(() => {
        loaded = result.current.loadQueryState();
      });

      expect(loaded).toBeNull();
      // Corrupted data should be removed
      expect(localStorage.getItem('crystal-forge-query-state')).toBeNull();
    });

    it('should validate basic structure', () => {
      localStorage.setItem('crystal-forge-query-state', '"invalid string"');

      const { result } = renderHook(() => useQueryPersistence());
      let loaded;

      act(() => {
        loaded = result.current.loadQueryState();
      });

      expect(loaded).toBeNull();
    });
  });

  describe('saveQueryState', () => {
    it('should save query state with debounce', () => {
      const { result } = renderHook(() => useQueryPersistence());
      const mockState = createMockQueryState();

      act(() => {
        result.current.saveQueryState(mockState);
      });

      // Should not be saved immediately (debounced)
      expect(localStorage.getItem('crystal-forge-query-state')).toBeNull();

      // Fast-forward time by 500ms (debounce delay)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now it should be saved
      const stored = localStorage.getItem('crystal-forge-query-state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.query).toEqual(mockState.query);
    });

    it('should debounce multiple calls', () => {
      const { result } = renderHook(() => useQueryPersistence());
      const state1 = createMockQueryState();
      const state2 = createMockQueryState();

      act(() => {
        result.current.saveQueryState(state1);
        vi.advanceTimersByTime(200);
        result.current.saveQueryState(state2);
      });

      // Should not be saved yet (debounce in progress)
      expect(localStorage.getItem('crystal-forge-query-state')).toBeNull();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should only save the latest state
      const stored = localStorage.getItem('crystal-forge-query-state');
      expect(stored).toBeTruthy();
    });

    it('should handle localStorage quota exceeded', () => {
      const { result } = renderHook(() => useQueryPersistence());
      const mockState = createMockQueryState();

      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      const error = new DOMException('', 'QuotaExceededError');
      localStorage.setItem = vi.fn(() => {
        throw error;
      });

      act(() => {
        result.current.saveQueryState(mockState);
        vi.advanceTimersByTime(500);
      });

      // Should handle error gracefully
      expect(localStorage.setItem).toHaveBeenCalled();

      // Restore original
      localStorage.setItem = originalSetItem;
    });

    it('should persist only specific fields', () => {
      const { result } = renderHook(() => useQueryPersistence());
      const mockState = createMockQueryState();
      mockState.results = { hits: { total: 100, hits: [] }, took: 50 } as any;
      mockState.isLoading = true;
      mockState.error = 'some error';

      act(() => {
        result.current.saveQueryState(mockState);
        vi.advanceTimersByTime(500);
      });

      const stored = localStorage.getItem('crystal-forge-query-state');
      const parsed = JSON.parse(stored!);

      // Results and status should not be persisted
      expect(parsed.results).toBeUndefined();
      expect(parsed.isLoading).toBeUndefined();
      expect(parsed.error).toBeUndefined();

      // Query should be persisted
      expect(parsed.query).toBeDefined();
    });
  });

  describe('clearQueryState', () => {
    it('should remove query state from localStorage', () => {
      const mockState = createMockQueryState();
      localStorage.setItem('crystal-forge-query-state', JSON.stringify(mockState));

      expect(localStorage.getItem('crystal-forge-query-state')).toBeTruthy();

      const { result } = renderHook(() => useQueryPersistence());

      act(() => {
        result.current.clearQueryState();
      });

      expect(localStorage.getItem('crystal-forge-query-state')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const { result } = renderHook(() => useQueryPersistence());

      // Mock localStorage.removeItem to throw
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => {
        act(() => {
          result.current.clearQueryState();
        });
      }).not.toThrow();

      // Restore original
      localStorage.removeItem = originalRemoveItem;
    });
  });
});
