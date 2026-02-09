import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useConnectionPersistence } from './useConnectionPersistence';
import type { ConnectionConfig } from '@crystal-forge/opensearch-client';

describe('useConnectionPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveConnectionState', () => {
    it('should save connection state to localStorage', () => {
      const { result } = renderHook(() => useConnectionPersistence());
      const config: ConnectionConfig = {
        host: 'https://localhost:9200',
        verifySsl: false,
        auth: {
          type: 'basic',
          username: 'admin',
          password: 'password123',
        },
      };

      act(() => {
        result.current.saveConnectionState(config, 'test-index');
      });

      const stored = localStorage.getItem('crystal-forge-connection-state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.host).toBe('https://localhost:9200');
      expect(parsed.index).toBe('test-index');
      expect(parsed.authType).toBe('basic');
      expect(parsed.username).toBe('admin');
      expect(parsed.password).toBe('password123');
    });

    it('should handle apiKey auth type', () => {
      const { result } = renderHook(() => useConnectionPersistence());
      const config: ConnectionConfig = {
        host: 'https://opensearch.example.com:9200',
        verifySsl: true,
        auth: {
          type: 'apiKey',
          apiKey: 'my-api-key-123',
        },
      };

      act(() => {
        result.current.saveConnectionState(config, null);
      });

      const stored = localStorage.getItem('crystal-forge-connection-state');
      const parsed = JSON.parse(stored!);
      expect(parsed.authType).toBe('apiKey');
      expect(parsed.apiKey).toBe('my-api-key-123');
      expect(parsed.username).toBeUndefined();
    });

    it('should handle null index', () => {
      const { result } = renderHook(() => useConnectionPersistence());
      const config: ConnectionConfig = {
        host: 'https://localhost:9200',
        verifySsl: false,
      };

      act(() => {
        result.current.saveConnectionState(config, null);
      });

      const stored = localStorage.getItem('crystal-forge-connection-state');
      const parsed = JSON.parse(stored!);
      expect(parsed.index).toBeNull();
    });
  });

  describe('loadConnectionState', () => {
    it('should load connection state from localStorage', () => {
      const { result: persistenceResult } = renderHook(() => useConnectionPersistence());
      const config: ConnectionConfig = {
        host: 'https://localhost:9200',
        verifySsl: false,
        auth: {
          type: 'basic',
          username: 'admin',
          password: 'password123',
        },
      };

      act(() => {
        persistenceResult.current.saveConnectionState(config, 'test-index');
      });

      // Now load it
      const { result: loadResult } = renderHook(() => useConnectionPersistence());
      let loaded;

      act(() => {
        loaded = loadResult.current.loadConnectionState();
      });

      expect(loaded).toBeTruthy();
      expect(loaded?.host).toBe('https://localhost:9200');
      expect(loaded?.index).toBe('test-index');
      expect(loaded?.username).toBe('admin');
    });

    it('should return null when no data is stored', () => {
      const { result } = renderHook(() => useConnectionPersistence());
      let loaded;

      act(() => {
        loaded = result.current.loadConnectionState();
      });

      expect(loaded).toBeNull();
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('crystal-forge-connection-state', 'invalid json {{{');

      const { result } = renderHook(() => useConnectionPersistence());
      let loaded;

      act(() => {
        loaded = result.current.loadConnectionState();
      });

      expect(loaded).toBeNull();
    });
  });

  describe('clearConnectionState', () => {
    it('should remove connection state from localStorage', () => {
      const { result: persistenceResult } = renderHook(() => useConnectionPersistence());
      const config: ConnectionConfig = {
        host: 'https://localhost:9200',
        verifySsl: false,
      };

      act(() => {
        persistenceResult.current.saveConnectionState(config, 'test-index');
      });

      expect(localStorage.getItem('crystal-forge-connection-state')).toBeTruthy();

      const { result: clearResult } = renderHook(() => useConnectionPersistence());
      act(() => {
        clearResult.current.clearConnectionState();
      });

      expect(localStorage.getItem('crystal-forge-connection-state')).toBeNull();
    });
  });
});
