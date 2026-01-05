'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  ConnectionConfig,
  AuthConfig,
  IndexInfo,
} from '@crystal-forge/opensearch-client';
import type { FieldInfo } from '@crystal-forge/opensearch-client';
import { useConnectionPersistence } from '@/hooks/useConnectionPersistence';

// =============================================================================
// Types
// =============================================================================

/**
 * Information about the current connection
 */
export interface ConnectionInfo {
  /** OpenSearch host URL */
  host: string;
  /** Currently selected index */
  index: string | null;
  /** Authentication type being used */
  authType: AuthConfig['type'] | null;
  /** Whether connected to the cluster */
  isConnected: boolean;
}

/**
 * Connection state interface
 */
export interface ConnectionState {
  /** Current connection info */
  connection: ConnectionInfo;
  /** Available indices */
  indices: IndexInfo[];
  /** Fields for the selected index */
  fields: FieldInfo[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Full connection config (for API calls) */
  config: ConnectionConfig | null;
}

/**
 * Actions available for connection management
 */
export interface ConnectionActions {
  /** Connect to an OpenSearch cluster */
  connect: (config: ConnectionConfig) => Promise<void>;
  /** Disconnect from the current cluster */
  disconnect: () => void;
  /** Set the current index */
  setIndex: (index: string) => Promise<void>;
  /** Update the list of available indices */
  setIndices: (indices: IndexInfo[]) => void;
  /** Set fields for the current index */
  setFields: (fields: FieldInfo[]) => void;
  /** Clear any error */
  clearError: () => void;
}

// =============================================================================
// Action Types
// =============================================================================

type ConnectionAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { config: ConnectionConfig; indices: IndexInfo[] } }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'SET_INDEX_START' }
  | { type: 'SET_INDEX_SUCCESS'; payload: { index: string; fields: FieldInfo[] } }
  | { type: 'SET_INDEX_ERROR'; payload: string }
  | { type: 'SET_INDICES'; payload: IndexInfo[] }
  | { type: 'SET_FIELDS'; payload: FieldInfo[] }
  | { type: 'CLEAR_ERROR' };

// =============================================================================
// Initial State
// =============================================================================

const initialState: ConnectionState = {
  connection: {
    host: '',
    index: null,
    authType: null,
    isConnected: false,
  },
  indices: [],
  fields: [],
  isLoading: false,
  error: null,
  config: null,
};

// =============================================================================
// Reducer
// =============================================================================

function connectionReducer(
  state: ConnectionState,
  action: ConnectionAction
): ConnectionState {
  switch (action.type) {
    case 'CONNECT_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'CONNECT_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        config: action.payload.config,
        indices: action.payload.indices,
        connection: {
          host: action.payload.config.host,
          index: null,
          authType: action.payload.config.auth?.type ?? null,
          isConnected: true,
        },
      };

    case 'CONNECT_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        connection: {
          ...state.connection,
          isConnected: false,
        },
      };

    case 'DISCONNECT':
      return initialState;

    case 'SET_INDEX_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'SET_INDEX_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        fields: action.payload.fields,
        connection: {
          ...state.connection,
          index: action.payload.index,
        },
      };

    case 'SET_INDEX_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'SET_INDICES':
      return {
        ...state,
        indices: action.payload,
      };

    case 'SET_FIELDS':
      return {
        ...state,
        fields: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface ConnectionContextValue {
  state: ConnectionState;
  actions: ConnectionActions;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  const { saveConnectionState, loadConnectionState, clearConnectionState } = useConnectionPersistence();

  // Auto-reconnect on mount if connection was previously saved
  useEffect(() => {
    const persisted = loadConnectionState();
    if (persisted && persisted.host) {
      // Auto-reconnect with persisted credentials
      const config: ConnectionConfig = {
        host: persisted.host,
        verifySsl: false,
        auth: persisted.authType === 'basic'
          ? { type: 'basic', username: persisted.username!, password: persisted.password! }
          : persisted.authType === 'apiKey'
          ? { type: 'apiKey', apiKey: persisted.apiKey! }
          : undefined,
      };

      // Connect with the persisted config
      void (async () => {
        try {
          dispatch({ type: 'CONNECT_START' });
          const response = await fetch('/api/opensearch/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          });

          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to connect');
          }

          dispatch({
            type: 'CONNECT_SUCCESS',
            payload: {
              config,
              indices: data.indices || [],
            },
          });

          // If there was a previously selected index, restore it
          if (persisted.index) {
            // Schedule setIndex to run after connect completes
            setTimeout(() => {
              void (async () => {
                const schemaParams = new URLSearchParams({
                  host: config.host,
                  index: persisted.index!,
                });
                if (config.auth) {
                  schemaParams.set('auth', JSON.stringify(config.auth));
                }
                const schemaResponse = await fetch(`/api/opensearch/schema?${schemaParams}`);

                const schemaContentType = schemaResponse.headers.get('content-type');
                if (!schemaContentType?.includes('application/json')) {
                  const text = await schemaResponse.text();
                  throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
                }

                const schemaData = await schemaResponse.json();
                if (schemaResponse.ok) {
                  dispatch({
                    type: 'SET_INDEX_SUCCESS',
                    payload: {
                      index: persisted.index!,
                      fields: schemaData.fields || [],
                    },
                  });
                }
              })();
            }, 0);
          }
        } catch (error) {
          dispatch({
            type: 'CONNECT_ERROR',
            payload: error instanceof Error ? error.message : 'Failed to reconnect',
          });
        }
      })();
    }
  }, [loadConnectionState]);

  const connect = useCallback(async (config: ConnectionConfig) => {
    dispatch({ type: 'CONNECT_START' });

    try {
      // Call the connect API endpoint
      const response = await fetch('/api/opensearch/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Failed to parse server response as JSON');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: {
          config,
          indices: data.indices || [],
        },
      });

      // Save connection state (without index for initial connect)
      saveConnectionState(config, null);
    } catch (error) {
      dispatch({
        type: 'CONNECT_ERROR',
        payload: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }, [saveConnectionState]);

  const disconnect = useCallback(() => {
    dispatch({ type: 'DISCONNECT' });
    clearConnectionState();
  }, [clearConnectionState]);

  const setIndex = useCallback(async (index: string) => {
    if (!state.config) {
      dispatch({ type: 'SET_INDEX_ERROR', payload: 'Not connected' });
      return;
    }

    dispatch({ type: 'SET_INDEX_START' });

    try {
      // Fetch schema for the selected index
      const params = new URLSearchParams({
        host: state.config.host,
        index,
      });

      if (state.config.auth) {
        params.set('auth', JSON.stringify(state.config.auth));
      }

      const response = await fetch(`/api/opensearch/schema?${params}`);

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Failed to parse server response as JSON');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch schema');
      }

      dispatch({
        type: 'SET_INDEX_SUCCESS',
        payload: {
          index,
          fields: data.fields || [],
        },
      });

      // Save connection state with the selected index
      saveConnectionState(state.config, index);
    } catch (error) {
      dispatch({
        type: 'SET_INDEX_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to set index',
      });
    }
  }, [state.config, saveConnectionState]);

  const setIndices = useCallback((indices: IndexInfo[]) => {
    dispatch({ type: 'SET_INDICES', payload: indices });
  }, []);

  const setFields = useCallback((fields: FieldInfo[]) => {
    dispatch({ type: 'SET_FIELDS', payload: fields });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const actions: ConnectionActions = {
    connect,
    disconnect,
    setIndex,
    setIndices,
    setFields,
    clearError,
  };

  return (
    <ConnectionContext.Provider value={{ state, actions }}>
      {children}
    </ConnectionContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access connection context
 * @throws Error if used outside of ConnectionProvider
 */
export function useConnection(): ConnectionContextValue {
  const context = useContext(ConnectionContext);

  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }

  return context;
}
