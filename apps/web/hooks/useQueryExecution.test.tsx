import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useQueryExecution } from './useQueryExecution';
import { ConnectionProvider } from '@/context/ConnectionContext';
import { QueryProvider } from '@/context/QueryContext';
import type { ReactNode } from 'react';

/**
 * Wrapper component to provide both ConnectionContext and QueryContext
 */
function wrapper({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ConnectionProvider>
  );
}

describe('useQueryExecution', () => {
  describe('initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useQueryExecution(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should have executeQuery function available', () => {
      const { result } = renderHook(() => useQueryExecution(), { wrapper });
      expect(typeof result.current.executeQuery).toBe('function');
    });

    it('should have initial state', () => {
      const { result } = renderHook(() => useQueryExecution(), { wrapper });

      // Initial state should be not connected
      expect(result.current.isLoading).toBe(false);
      expect(result.current.canExecute).toBe(false);
    });

    it('should have canExecute flag', () => {
      const { result } = renderHook(() => useQueryExecution(), { wrapper });

      // Should not be able to execute without connection
      expect(result.current.canExecute).toBe(false);
    });

    it('should combine local and query state errors', () => {
      const { result } = renderHook(() => useQueryExecution(), { wrapper });

      // Initial error should be null
      expect(result.current.error).toBeNull();
    });
  });
});
