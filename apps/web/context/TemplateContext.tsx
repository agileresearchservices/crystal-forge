'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { QueryTemplate, QueryHistoryEntry, AggregationTemplate } from '@crystal-forge/storage';
import type { QueryState } from '@crystal-forge/query-dsl';
import {
  initDB,
  getAllTemplates,
  getTemplatesByCategory,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  getCustomTemplates,
  getBuiltInTemplates,
  duplicateTemplate,
  exportTemplate,
  importTemplate,
  addToHistory,
  getAllHistory,
  getHistoryForIndex,
  getRecentHistory,
  deleteHistoryEntry,
  clearHistory,
  exportHistory,
  getAllAggregationTemplates,
  getAggregationTemplatesByCategory,
  getAggregationTemplatesByType,
  getAggregationTemplateById,
  saveAggregationTemplate,
  updateAggregationTemplate,
  deleteAggregationTemplate,
  getCustomAggregationTemplates,
  getBuiltInAggregationTemplates,
  duplicateAggregationTemplate,
  exportAggregationTemplate,
  importAggregationTemplate,
  seedTemplates,
  BUILT_IN_QUERY_TEMPLATES,
  BUILT_IN_AGGREGATION_TEMPLATES,
} from '@crystal-forge/storage';

// =============================================================================
// Types
// =============================================================================

/**
 * Template library state interface
 */
export interface TemplateState {
  /** All query templates (both built-in and custom) */
  queryTemplates: QueryTemplate[];
  /** All aggregation templates (both built-in and custom) */
  aggregationTemplates: AggregationTemplate[];
  /** Query execution history */
  history: QueryHistoryEntry[];
  /** Loading state */
  isLoading: boolean;
  /** Database initialization state */
  isInitialized: boolean;
  /** Error message if any */
  error: string | null;
  /** Currently selected/filtered templates */
  filteredTemplates: QueryTemplate[];
}

// =============================================================================
// Action Types
// =============================================================================

type TemplateAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_QUERY_TEMPLATES'; payload: QueryTemplate[] }
  | { type: 'SET_AGGREGATION_TEMPLATES'; payload: AggregationTemplate[] }
  | { type: 'SET_HISTORY'; payload: QueryHistoryEntry[] }
  | { type: 'SET_FILTERED_TEMPLATES'; payload: QueryTemplate[] }
  | { type: 'ADD_QUERY_TEMPLATE'; payload: QueryTemplate }
  | { type: 'UPDATE_QUERY_TEMPLATE'; payload: QueryTemplate }
  | { type: 'REMOVE_QUERY_TEMPLATE'; payload: string }
  | { type: 'ADD_AGGREGATION_TEMPLATE'; payload: AggregationTemplate }
  | { type: 'UPDATE_AGGREGATION_TEMPLATE'; payload: AggregationTemplate }
  | { type: 'REMOVE_AGGREGATION_TEMPLATE'; payload: string }
  | { type: 'ADD_HISTORY_ENTRY'; payload: QueryHistoryEntry }
  | { type: 'REMOVE_HISTORY_ENTRY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'RESET' };

// =============================================================================
// Initial State
// =============================================================================

const initialState: TemplateState = {
  queryTemplates: [],
  aggregationTemplates: [],
  history: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  filteredTemplates: [],
};

// =============================================================================
// Reducer
// =============================================================================

function templateReducer(
  state: TemplateState,
  action: TemplateAction
): TemplateState {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
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
      };

    case 'SET_QUERY_TEMPLATES':
      return {
        ...state,
        queryTemplates: action.payload,
      };

    case 'SET_AGGREGATION_TEMPLATES':
      return {
        ...state,
        aggregationTemplates: action.payload,
      };

    case 'SET_HISTORY':
      return {
        ...state,
        history: action.payload,
      };

    case 'SET_FILTERED_TEMPLATES':
      return {
        ...state,
        filteredTemplates: action.payload,
      };

    case 'ADD_QUERY_TEMPLATE':
      return {
        ...state,
        queryTemplates: [...state.queryTemplates, action.payload],
      };

    case 'UPDATE_QUERY_TEMPLATE':
      return {
        ...state,
        queryTemplates: state.queryTemplates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'REMOVE_QUERY_TEMPLATE':
      return {
        ...state,
        queryTemplates: state.queryTemplates.filter((t) => t.id !== action.payload),
      };

    case 'ADD_AGGREGATION_TEMPLATE':
      return {
        ...state,
        aggregationTemplates: [...state.aggregationTemplates, action.payload],
      };

    case 'UPDATE_AGGREGATION_TEMPLATE':
      return {
        ...state,
        aggregationTemplates: state.aggregationTemplates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'REMOVE_AGGREGATION_TEMPLATE':
      return {
        ...state,
        aggregationTemplates: state.aggregationTemplates.filter(
          (t) => t.id !== action.payload
        ),
      };

    case 'ADD_HISTORY_ENTRY':
      return {
        ...state,
        history: [action.payload, ...state.history],
      };

    case 'REMOVE_HISTORY_ENTRY':
      return {
        ...state,
        history: state.history.filter((h) => h.id !== action.payload),
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface TemplateContextValue {
  state: TemplateState;
  dispatch: React.Dispatch<TemplateAction>;
  // Template operations
  loadAllTemplates: () => Promise<void>;
  loadTemplatesByCategory: (category: string) => Promise<void>;
  saveCurrentQuery: (
    query: QueryState,
    name: string,
    description: string,
    category: string,
    tags?: string[]
  ) => Promise<string>;
  loadTemplate: (id: string) => Promise<QueryTemplate | undefined>;
  deleteTemplate: (id: string) => Promise<void>;
  updateTemplateItem: (id: string, updates: Partial<QueryTemplate>) => Promise<void>;
  findTemplate: (searchTerm: string) => Promise<QueryTemplate[]>;
  getCustomTemplates: () => Promise<QueryTemplate[]>;
  getBuiltInTemplates: () => Promise<QueryTemplate[]>;
  duplicateQueryTemplate: (id: string, newName: string) => Promise<string>;
  exportQueryTemplate: (id: string) => Promise<string>;
  importQueryTemplate: (jsonString: string) => Promise<string>;
  // History operations
  recordQueryExecution: (
    query: QueryState,
    indexName: string,
    resultCount: number
  ) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadHistoryForIndex: (indexName: string) => Promise<void>;
  loadRecentHistory: (limit?: number) => Promise<void>;
  removeHistoryEntry: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  exportQueryHistory: () => Promise<string>;
  // Aggregation operations
  loadAggregationTemplates: () => Promise<void>;
  loadAggregationsByCategory: (category: string) => Promise<void>;
  loadAggregationsByType: (aggType: string) => Promise<void>;
  loadAggregation: (id: string) => Promise<AggregationTemplate | undefined>;
  saveAggregation: (
    template: Omit<AggregationTemplate, 'id' | 'created_at'>
  ) => Promise<string>;
  updateAggregation: (id: string, updates: Partial<AggregationTemplate>) => Promise<void>;
  deleteAggregation: (id: string) => Promise<void>;
  getCustomAggregations: () => Promise<AggregationTemplate[]>;
  getBuiltInAggregations: () => Promise<AggregationTemplate[]>;
  duplicateAggregation: (id: string, newName: string) => Promise<string>;
  exportAggregation: (id: string) => Promise<string>;
  importAggregation: (jsonString: string) => Promise<string>;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface TemplateProviderProps {
  children: ReactNode;
}

export function TemplateProvider({ children }: TemplateProviderProps) {
  const [state, dispatch] = useReducer(templateReducer, initialState);

  // Initialize database on mount
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Initialize IndexedDB and seed templates
        await initDB();

        // Load all templates and history
        const [templates, aggs, hist] = await Promise.all([
          getAllTemplates(),
          getAllAggregationTemplates(),
          getAllHistory(),
        ]);

        dispatch({ type: 'SET_QUERY_TEMPLATES', payload: templates });
        dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
        dispatch({ type: 'SET_HISTORY', payload: hist });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to initialize template database';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        console.error('Template database initialization failed:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeDatabase();
  }, []);

  // =========================================================================
  // Template Operations
  // =========================================================================

  const loadAllTemplates = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const templates = await getAllTemplates();
      dispatch({ type: 'SET_QUERY_TEMPLATES', payload: templates });
      dispatch({ type: 'SET_FILTERED_TEMPLATES', payload: templates });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadTemplatesByCategory = useCallback(async (category: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const templates = await getTemplatesByCategory(category);
      dispatch({ type: 'SET_FILTERED_TEMPLATES', payload: templates });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to load templates for category ${category}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const saveCurrentQuery = useCallback(
    async (
      query: QueryState,
      name: string,
      description: string,
      category: string,
      tags: string[] = []
    ) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        const id = await saveTemplate({
          name,
          description,
          category: category as 'common' | 'ecommerce' | 'advanced' | 'custom',
          tags,
          query,
          isBuiltIn: false,
        });

        // Reload templates to get the new one
        const templates = await getAllTemplates();
        dispatch({ type: 'SET_QUERY_TEMPLATES', payload: templates });

        return id;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to save template';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    []
  );

  const loadTemplate = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const template = await getAllTemplates().then((t) => t.find((x) => x.id === id));
      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await deleteTemplate(id);
      dispatch({ type: 'REMOVE_QUERY_TEMPLATE', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const updateTemplateItem = useCallback(async (id: string, updates: Partial<QueryTemplate>) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await updateTemplate(id, updates);
      const updatedTemplate = await getAllTemplates().then((t) => t.find((x) => x.id === id));
      if (updatedTemplate) {
        dispatch({ type: 'UPDATE_QUERY_TEMPLATE', payload: updatedTemplate });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const findTemplate = useCallback(async (searchTerm: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const results = await searchTemplates(searchTerm);
      dispatch({ type: 'SET_FILTERED_TEMPLATES', payload: results });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  const getCustomTemplatesList = useCallback(async () => {
    try {
      return await getCustomTemplates();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load custom templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  const getBuiltInTemplatesList = useCallback(async () => {
    try {
      return await getBuiltInTemplates();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load built-in templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  const duplicateQueryTemplate = useCallback(async (id: string, newName: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newId = await duplicateTemplate(id, newName);
      const templates = await getAllTemplates();
      dispatch({ type: 'SET_QUERY_TEMPLATES', payload: templates });
      return newId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const exportQueryTemplate = useCallback(async (id: string) => {
    try {
      return await exportTemplate(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const importQueryTemplate = useCallback(async (jsonString: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newId = await importTemplate(jsonString);
      const templates = await getAllTemplates();
      dispatch({ type: 'SET_QUERY_TEMPLATES', payload: templates });
      return newId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // =========================================================================
  // History Operations
  // =========================================================================

  const recordQueryExecution = useCallback(
    async (query: QueryState, indexName: string, resultCount: number) => {
      try {
        await addToHistory(query, indexName, resultCount);
        const hist = await getAllHistory();
        dispatch({ type: 'SET_HISTORY', payload: hist });
      } catch (error) {
        console.error('Failed to record query in history:', error);
        // Don't dispatch error for history as it's non-critical
      }
    },
    []
  );

  const loadHistory = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const hist = await getAllHistory();
      dispatch({ type: 'SET_HISTORY', payload: hist });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadHistoryForIndex = useCallback(async (indexName: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const hist = await getHistoryForIndex(indexName);
      dispatch({ type: 'SET_HISTORY', payload: hist });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to load history for ${indexName}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadRecentHistory = useCallback(async (limit: number = 10) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const hist = await getRecentHistory(limit);
      dispatch({ type: 'SET_HISTORY', payload: hist });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recent history';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const removeHistoryEntry = useCallback(async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      dispatch({ type: 'REMOVE_HISTORY_ENTRY', payload: id });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete history entry';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const clearAllHistory = useCallback(async () => {
    try {
      await clearHistory();
      dispatch({ type: 'CLEAR_HISTORY' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear history';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const exportQueryHistory = useCallback(async () => {
    try {
      return await exportHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export history';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // =========================================================================
  // Aggregation Operations
  // =========================================================================

  const loadAggregationTemplates = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const aggs = await getAllAggregationTemplates();
      dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load aggregation templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadAggregationsByCategory = useCallback(async (category: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const aggs = await getAggregationTemplatesByCategory(category);
      dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to load aggregations for category ${category}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadAggregationsByType = useCallback(async (aggType: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const aggs = await getAggregationTemplatesByType(aggType);
      dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to load aggregations of type ${aggType}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadAggregation = useCallback(async (id: string) => {
    try {
      return await getAggregationTemplateById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load aggregation';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const saveAggregation = useCallback(
    async (template: Omit<AggregationTemplate, 'id' | 'created_at'>) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        const newId = await saveAggregationTemplate(template);
        const aggs = await getAllAggregationTemplates();
        dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
        return newId;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to save aggregation template';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    []
  );

  const updateAggregation = useCallback(
    async (id: string, updates: Partial<AggregationTemplate>) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        await updateAggregationTemplate(id, updates);
        const aggs = await getAllAggregationTemplates();
        dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update aggregation template';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    []
  );

  const deleteAggregation = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await deleteAggregationTemplate(id);
      dispatch({ type: 'REMOVE_AGGREGATION_TEMPLATE', payload: id });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete aggregation template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const getCustomAggregationsList = useCallback(async () => {
    try {
      return await getCustomAggregationTemplates();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load custom aggregation templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  const getBuiltInAggregationsList = useCallback(async () => {
    try {
      return await getBuiltInAggregationTemplates();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load built-in aggregation templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  const duplicateAggregation = useCallback(async (id: string, newName: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newId = await duplicateAggregationTemplate(id, newName);
      const aggs = await getAllAggregationTemplates();
      dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
      return newId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to duplicate aggregation template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const exportAggregation = useCallback(async (id: string) => {
    try {
      return await exportAggregationTemplate(id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to export aggregation template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const importAggregation = useCallback(async (jsonString: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newId = await importAggregationTemplate(jsonString);
      const aggs = await getAllAggregationTemplates();
      dispatch({ type: 'SET_AGGREGATION_TEMPLATES', payload: aggs });
      return newId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to import aggregation template';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const value: TemplateContextValue = {
    state,
    dispatch,
    loadAllTemplates,
    loadTemplatesByCategory,
    saveCurrentQuery,
    loadTemplate,
    deleteTemplate,
    updateTemplateItem,
    findTemplate,
    getCustomTemplates: getCustomTemplatesList,
    getBuiltInTemplates: getBuiltInTemplatesList,
    duplicateQueryTemplate,
    exportQueryTemplate,
    importQueryTemplate,
    recordQueryExecution,
    loadHistory,
    loadHistoryForIndex,
    loadRecentHistory,
    removeHistoryEntry,
    clearAllHistory,
    exportQueryHistory,
    loadAggregationTemplates,
    loadAggregationsByCategory,
    loadAggregationsByType,
    loadAggregation,
    saveAggregation,
    updateAggregation,
    deleteAggregation,
    getCustomAggregations: getCustomAggregationsList,
    getBuiltInAggregations: getBuiltInAggregationsList,
    duplicateAggregation,
    exportAggregation,
    importAggregation,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access template context
 * @throws Error if used outside of TemplateProvider
 */
export function useTemplates(): TemplateContextValue {
  const context = useContext(TemplateContext);

  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }

  return context;
}
