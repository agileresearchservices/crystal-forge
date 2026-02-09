import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useConnection } from './ConnectionContext';
import { ConnectionProvider } from './ConnectionContext';
import type { ConnectionInfo } from '@crystal-forge/opensearch-client';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ConnectionProvider>{children}</ConnectionProvider>;
}

describe('ConnectionContext', () => {
  describe('initial state', () => {
    it('should start disconnected', () => {
      const { result } = renderHook(() => useConnection(), { wrapper });
      expect(result.current.state.connection.isConnected).toBe(false);
    });

    it('should have empty fields array', () => {
      const { result } = renderHook(() => useConnection(), { wrapper });
      expect(result.current.state.fields).toEqual([]);
    });

    it('should have loading false', () => {
      const { result } = renderHook(() => useConnection(), { wrapper });
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('initial connection', () => {
    it('should start disconnected with empty config', () => {
      const { result } = renderHook(() => useConnection(), { wrapper });
      expect(result.current.state.connection.isConnected).toBe(false);
      expect(result.current.state.connection.host).toBe('');
      expect(result.current.state.config).toBeNull();
    });
  });

  describe('setFields', () => {
    it('should set fields array', () => {
      const { result } = renderHook(() => useConnection(), { wrapper });

      const fields = [
        {
          path: 'title',
          type: 'text' as const,
          isNested: false,
          isMultiField: false,
        },
        {
          path: 'price',
          type: 'long' as const,
          isNested: false,
          isMultiField: false,
        },
      ];

      act(() => {
        result.current.actions.setFields(fields);
      });

      expect(result.current.state.fields).toHaveLength(2);
      expect(result.current.state.fields[0].path).toBe('title');
      expect(result.current.state.fields[1].path).toBe('price');
    });
  });

  describe('disconnect', () => {
    it('should clear connection and fields', () => {
      const { result } = renderHook(() => useConnection(), { wrapper });

      // Disconnect should reset to initial state
      act(() => {
        result.current.actions.disconnect();
      });

      expect(result.current.state.connection.isConnected).toBe(false);
      expect(result.current.state.fields).toEqual([]);
      expect(result.current.state.config).toBeNull();
    });
  });
});
