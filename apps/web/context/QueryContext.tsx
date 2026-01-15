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
  QueryNode,
  QueryState,
  BoolQueryNode,
  HighlightConfig,
  SuggesterConfig,
  Aggregation,
} from '@crystal-forge/query-dsl';
import type { SearchResponse } from '@crystal-forge/opensearch-client';
import { useQueryPersistence } from '@/hooks/useQueryPersistence';

// =============================================================================
// Types
// =============================================================================

/**
 * Query builder state interface
 */
export interface QueryBuilderState {
  /** Current query state */
  query: QueryState;
  /** Aggregations to execute with query */
  aggregations: Aggregation[];
  /** Search results if any */
  results: SearchResponse | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Path to a node in the query tree
 */
export type NodePath = string[];

// =============================================================================
// Action Types
// =============================================================================

type QueryAction =
  | { type: 'ADD_NODE'; payload: { path: NodePath; node: QueryNode } }
  | { type: 'REMOVE_NODE'; payload: { path: NodePath; nodeId: string } }
  | { type: 'UPDATE_NODE'; payload: { path: NodePath; nodeId: string; updates: Partial<QueryNode> } }
  | { type: 'SET_RESULTS'; payload: SearchResponse }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_QUERY' }
  | { type: 'SET_QUERY'; payload: QueryNode | null }
  | { type: 'SET_PAGINATION'; payload: { size?: number; from?: number } }
  | { type: 'SET_HIGHLIGHT'; payload: HighlightConfig | undefined }
  | { type: 'SET_SUGGEST'; payload: Record<string, SuggesterConfig> | undefined }
  | { type: 'ADD_AGGREGATION'; payload: Aggregation }
  | { type: 'REMOVE_AGGREGATION'; payload: string }
  | { type: 'UPDATE_AGGREGATION'; payload: { index: number; aggregation: Aggregation } }
  | { type: 'SET_AGGREGATIONS'; payload: Aggregation[] };

// =============================================================================
// Helper Functions
// =============================================================================

let nodeIdCounter = 0;

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  return `node_${++nodeIdCounter}_${Date.now()}`;
}

/**
 * Create an empty bool query node
 */
export function createEmptyBoolQuery(): BoolQueryNode {
  return {
    id: generateNodeId(),
    type: 'bool',
    must: [],
    should: [],
    must_not: [],
    filter: [],
  };
}

/**
 * Find a node in the query tree by path
 */
function findNodeAtPath(root: QueryNode | null, path: NodePath): QueryNode | null {
  if (!root || path.length === 0) {
    return root;
  }

  if (root.type !== 'bool') {
    return null;
  }

  const boolNode = root as BoolQueryNode;
  const [clause, ...restPath] = path;

  if (!clause || !['must', 'should', 'must_not', 'filter'].includes(clause)) {
    return null;
  }

  const clauseKey = clause as keyof Pick<BoolQueryNode, 'must' | 'should' | 'must_not' | 'filter'>;
  const nodes = boolNode[clauseKey];

  if (restPath.length === 0) {
    return boolNode;
  }

  const [indexStr, ...remaining] = restPath;
  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0 || index >= nodes.length) {
    return null;
  }

  return findNodeAtPath(nodes[index], remaining);
}

/**
 * Update a node at a specific path in the query tree
 */
function updateNodeAtPath(
  root: QueryNode | null,
  path: NodePath,
  updater: (node: QueryNode) => QueryNode
): QueryNode | null {
  if (!root) {
    return null;
  }

  if (path.length === 0) {
    return updater(root);
  }

  if (root.type !== 'bool') {
    return root;
  }

  const boolNode = { ...root } as BoolQueryNode;
  const [clause, ...restPath] = path;

  if (!clause || !['must', 'should', 'must_not', 'filter'].includes(clause)) {
    return root;
  }

  const clauseKey = clause as keyof Pick<BoolQueryNode, 'must' | 'should' | 'must_not' | 'filter'>;

  if (restPath.length === 0) {
    // Cannot update at clause level, need node index
    return root;
  }

  const [indexStr, ...remaining] = restPath;
  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0 || index >= boolNode[clauseKey].length) {
    return root;
  }

  const newNodes = [...boolNode[clauseKey]];
  const updatedNode = updateNodeAtPath(newNodes[index], remaining, updater);

  if (updatedNode) {
    newNodes[index] = updatedNode;
    return { ...boolNode, [clauseKey]: newNodes };
  }

  return root;
}

/**
 * Add a node to a specific path in the query tree
 */
function addNodeAtPath(
  root: QueryNode | null,
  path: NodePath,
  node: QueryNode
): QueryNode {
  // If no root or empty path with no root, create a new bool query
  if (!root) {
    if (path.length === 0) {
      return node;
    }
    // Create root bool query and add to specified clause
    const boolQuery = createEmptyBoolQuery();
    return addNodeAtPath(boolQuery, path, node);
  }

  if (path.length === 0) {
    // Replace root
    return node;
  }

  if (root.type !== 'bool') {
    // Wrap existing in bool query
    const boolQuery = createEmptyBoolQuery();
    boolQuery.must.push(root);
    return addNodeAtPath(boolQuery, path, node);
  }

  const boolNode = { ...root } as BoolQueryNode;
  const [clause, ...restPath] = path;

  if (!clause || !['must', 'should', 'must_not', 'filter'].includes(clause)) {
    return root;
  }

  const clauseKey = clause as keyof Pick<BoolQueryNode, 'must' | 'should' | 'must_not' | 'filter'>;

  if (restPath.length === 0) {
    // Add to this clause
    return {
      ...boolNode,
      [clauseKey]: [...boolNode[clauseKey], node],
    };
  }

  // Navigate deeper
  const [indexStr, ...remaining] = restPath;
  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0 || index >= boolNode[clauseKey].length) {
    return root;
  }

  const newNodes = [...boolNode[clauseKey]];
  newNodes[index] = addNodeAtPath(newNodes[index], remaining, node);

  return { ...boolNode, [clauseKey]: newNodes };
}

/**
 * Remove a node from a specific path in the query tree
 */
function removeNodeAtPath(
  root: QueryNode | null,
  path: NodePath,
  nodeId: string
): QueryNode | null {
  if (!root || root.type !== 'bool') {
    return root;
  }

  const boolNode = { ...root } as BoolQueryNode;
  const [clause, ...restPath] = path;

  if (!clause || !['must', 'should', 'must_not', 'filter'].includes(clause)) {
    return root;
  }

  const clauseKey = clause as keyof Pick<BoolQueryNode, 'must' | 'should' | 'must_not' | 'filter'>;

  if (restPath.length === 0) {
    // Remove from this clause
    return {
      ...boolNode,
      [clauseKey]: boolNode[clauseKey].filter((n: QueryNode) => n.id !== nodeId),
    };
  }

  // Navigate deeper
  const [indexStr, ...remaining] = restPath;
  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0 || index >= boolNode[clauseKey].length) {
    return root;
  }

  const newNodes = [...boolNode[clauseKey]];
  const result = removeNodeAtPath(newNodes[index], remaining, nodeId);

  if (result) {
    newNodes[index] = result;
    return { ...boolNode, [clauseKey]: newNodes };
  }

  return root;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: QueryBuilderState = {
  query: {
    query: null,
    size: 10,
    from: 0,
  },
  aggregations: [],
  results: null,
  isLoading: false,
  error: null,
};

// =============================================================================
// Reducer
// =============================================================================

function queryReducer(
  state: QueryBuilderState,
  action: QueryAction
): QueryBuilderState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newQuery = addNodeAtPath(
        state.query.query,
        action.payload.path,
        action.payload.node
      );
      return {
        ...state,
        query: {
          ...state.query,
          query: newQuery,
        },
      };
    }

    case 'REMOVE_NODE': {
      const newQuery = removeNodeAtPath(
        state.query.query,
        action.payload.path,
        action.payload.nodeId
      );
      return {
        ...state,
        query: {
          ...state.query,
          query: newQuery,
        },
      };
    }

    case 'UPDATE_NODE': {
      const newQuery = updateNodeAtPath(
        state.query.query,
        action.payload.path,
        (node) => {
          if (node.id === action.payload.nodeId) {
            return { ...node, ...action.payload.updates } as QueryNode;
          }
          return node;
        }
      );

      // If path-based update didn't work, try direct update
      if (newQuery === state.query.query && state.query.query) {
        const directUpdate = (node: QueryNode): QueryNode => {
          if (node.id === action.payload.nodeId) {
            return { ...node, ...action.payload.updates } as QueryNode;
          }
          if (node.type === 'bool') {
            const boolNode = node as BoolQueryNode;
            return {
              ...boolNode,
              must: boolNode.must.map(directUpdate),
              should: boolNode.should.map(directUpdate),
              must_not: boolNode.must_not.map(directUpdate),
              filter: boolNode.filter.map(directUpdate),
            };
          }
          return node;
        };

        return {
          ...state,
          query: {
            ...state.query,
            query: directUpdate(state.query.query),
          },
        };
      }

      return {
        ...state,
        query: {
          ...state.query,
          query: newQuery,
        },
      };
    }

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'RESET_QUERY':
      return {
        ...initialState,
      };

    case 'SET_QUERY':
      return {
        ...state,
        query: {
          ...state.query,
          query: action.payload,
        },
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        query: {
          ...state.query,
          size: action.payload.size ?? state.query.size,
          from: action.payload.from ?? state.query.from,
        },
      };

    case 'SET_HIGHLIGHT':
      return {
        ...state,
        query: {
          ...state.query,
          highlight: action.payload,
        },
      };

    case 'SET_SUGGEST':
      return {
        ...state,
        query: {
          ...state.query,
          suggest: action.payload,
        },
      };

    case 'ADD_AGGREGATION':
      return {
        ...state,
        aggregations: [...state.aggregations, action.payload],
      };

    case 'REMOVE_AGGREGATION':
      return {
        ...state,
        aggregations: state.aggregations.filter((agg) => agg.name !== action.payload),
      };

    case 'UPDATE_AGGREGATION':
      return {
        ...state,
        aggregations: state.aggregations.map((agg, i) =>
          i === action.payload.index ? action.payload.aggregation : agg
        ),
      };

    case 'SET_AGGREGATIONS':
      return {
        ...state,
        aggregations: action.payload,
      };

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface QueryContextValue {
  state: QueryBuilderState;
  dispatch: React.Dispatch<QueryAction>;
  addNode: (path: NodePath, node: QueryNode) => void;
  removeNode: (path: NodePath, nodeId: string) => void;
  updateNode: (path: NodePath, nodeId: string, updates: Partial<QueryNode>) => void;
  setResults: (results: SearchResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetQuery: () => void;
  setQuery: (query: QueryNode | null) => void;
  setPagination: (pagination: { size?: number; from?: number }) => void;
  setHighlight: (highlight: HighlightConfig | undefined) => void;
  setSuggest: (suggest: Record<string, SuggesterConfig> | undefined) => void;
  addAggregation: (aggregation: Aggregation) => void;
  removeAggregation: (name: string) => void;
  updateAggregation: (index: number, aggregation: Aggregation) => void;
  setAggregations: (aggregations: Aggregation[]) => void;
}

const QueryContext = createContext<QueryContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [state, dispatch] = useReducer(queryReducer, initialState);
  const { loadQueryState, saveQueryState, clearQueryState } = useQueryPersistence();

  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadQueryState();
    if (persisted) {
      // Restore query state
      if (persisted.query) {
        dispatch({ type: 'SET_QUERY', payload: persisted.query });
      }
      if (persisted.size !== undefined || persisted.from !== undefined) {
        dispatch({ type: 'SET_PAGINATION', payload: { size: persisted.size, from: persisted.from } });
      }
      if (persisted.highlight) {
        dispatch({ type: 'SET_HIGHLIGHT', payload: persisted.highlight });
      }
      if (persisted.suggest) {
        dispatch({ type: 'SET_SUGGEST', payload: persisted.suggest });
      }
    }
  }, [loadQueryState]);

  // Auto-save query state on changes (debounced)
  useEffect(() => {
    saveQueryState(state.query);
  }, [state.query, saveQueryState]);

  const addNode = useCallback((path: NodePath, node: QueryNode) => {
    dispatch({ type: 'ADD_NODE', payload: { path, node } });
  }, []);

  const removeNode = useCallback((path: NodePath, nodeId: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: { path, nodeId } });
  }, []);

  const updateNode = useCallback(
    (path: NodePath, nodeId: string, updates: Partial<QueryNode>) => {
      dispatch({ type: 'UPDATE_NODE', payload: { path, nodeId, updates } });
    },
    []
  );

  const setResults = useCallback((results: SearchResponse) => {
    dispatch({ type: 'SET_RESULTS', payload: results });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const resetQuery = useCallback(() => {
    dispatch({ type: 'RESET_QUERY' });
    clearQueryState();
  }, [clearQueryState]);

  const setQuery = useCallback((query: QueryNode | null) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  }, []);

  const setPagination = useCallback(
    (pagination: { size?: number; from?: number }) => {
      dispatch({ type: 'SET_PAGINATION', payload: pagination });
    },
    []
  );

  const setHighlight = useCallback(
    (highlight: HighlightConfig | undefined) => {
      dispatch({ type: 'SET_HIGHLIGHT', payload: highlight });
    },
    []
  );

  const setSuggest = useCallback(
    (suggest: Record<string, SuggesterConfig> | undefined) => {
      dispatch({ type: 'SET_SUGGEST', payload: suggest });
    },
    []
  );

  const addAggregation = useCallback((aggregation: Aggregation) => {
    dispatch({ type: 'ADD_AGGREGATION', payload: aggregation });
  }, []);

  const removeAggregation = useCallback((name: string) => {
    dispatch({ type: 'REMOVE_AGGREGATION', payload: name });
  }, []);

  const updateAggregation = useCallback((index: number, aggregation: Aggregation) => {
    dispatch({ type: 'UPDATE_AGGREGATION', payload: { index, aggregation } });
  }, []);

  const setAggregations = useCallback((aggregations: Aggregation[]) => {
    dispatch({ type: 'SET_AGGREGATIONS', payload: aggregations });
  }, []);

  return (
    <QueryContext.Provider
      value={{
        state,
        dispatch,
        addNode,
        removeNode,
        updateNode,
        setResults,
        setLoading,
        setError,
        resetQuery,
        setQuery,
        setPagination,
        setHighlight,
        setSuggest,
        addAggregation,
        removeAggregation,
        updateAggregation,
        setAggregations,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access query context
 * @throws Error if used outside of QueryProvider
 */
export function useQuery(): QueryContextValue {
  const context = useContext(QueryContext);

  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider');
  }

  return context;
}
