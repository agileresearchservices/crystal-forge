'use client';

import { useCallback, useMemo } from 'react';
import type { ConnectionConfig } from '@crystal-forge/opensearch-client';

const STORAGE_KEY = 'crystal-forge-connection-state';

export interface PersistedConnectionState {
  host: string;
  index: string | null;
  authType: 'basic' | 'apiKey' | null;
  username?: string;
  password?: string;
  apiKey?: string;
}

export function useConnectionPersistence() {
  const saveConnectionState = useCallback((config: ConnectionConfig, index: string | null) => {
    try {
      // Only persist basic and apiKey auth types (not awsSigV4)
      const authType = (config.auth?.type === 'basic' || config.auth?.type === 'apiKey') ? config.auth.type : null;
      const state: PersistedConnectionState = {
        host: config.host,
        index,
        authType,
        username: config.auth?.type === 'basic' ? config.auth.username : undefined,
        password: config.auth?.type === 'basic' ? config.auth.password : undefined,
        apiKey: config.auth?.type === 'apiKey' ? config.auth.apiKey : undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save connection state:', error);
    }
  }, []);

  const loadConnectionState = useCallback((): PersistedConnectionState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load connection state:', error);
      return null;
    }
  }, []);

  const clearConnectionState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear connection state:', error);
    }
  }, []);

  return useMemo(
    () => ({ saveConnectionState, loadConnectionState, clearConnectionState }),
    [saveConnectionState, loadConnectionState, clearConnectionState]
  );
}
