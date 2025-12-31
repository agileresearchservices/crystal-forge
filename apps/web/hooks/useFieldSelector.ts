'use client';

import { useState, useMemo, useCallback } from 'react';
import type { FieldInfo } from '@crystal-forge/opensearch-client';

/**
 * Hook for managing field selection state
 * Provides filtering and selection functionality for field lists
 */
export function useFieldSelector(fields: FieldInfo[]) {
  const [selectedField, setSelectedField] = useState<FieldInfo | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');

  /**
   * Filter fields based on search term
   */
  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) {
      return fields;
    }

    const searchLower = fieldSearch.toLowerCase();
    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(searchLower) ||
        field.path.toLowerCase().includes(searchLower) ||
        field.type.toLowerCase().includes(searchLower)
    );
  }, [fields, fieldSearch]);

  /**
   * Group fields by their root path segment
   */
  const groupedFields = useMemo(() => {
    const groups: Record<string, FieldInfo[]> = {};

    for (const field of filteredFields) {
      const rootSegment = field.path.split('.')[0];
      if (!groups[rootSegment]) {
        groups[rootSegment] = [];
      }
      groups[rootSegment].push(field);
    }

    return groups;
  }, [filteredFields]);

  /**
   * Get fields of a specific type
   */
  const getFieldsByType = useCallback(
    (type: string) => {
      return filteredFields.filter((field) => field.type === type);
    },
    [filteredFields]
  );

  /**
   * Get searchable fields only
   */
  const searchableFields = useMemo(() => {
    return filteredFields.filter((field) => field.searchable);
  }, [filteredFields]);

  /**
   * Get aggregatable fields only
   */
  const aggregatableFields = useMemo(() => {
    return filteredFields.filter((field) => field.aggregatable);
  }, [filteredFields]);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedField(null);
  }, []);

  /**
   * Clear the search filter
   */
  const clearSearch = useCallback(() => {
    setFieldSearch('');
  }, []);

  return {
    // State
    selectedField,
    fieldSearch,
    filteredFields,
    groupedFields,
    searchableFields,
    aggregatableFields,

    // Actions
    setSelectedField,
    setFieldSearch,
    getFieldsByType,
    clearSelection,
    clearSearch,
  };
}

export type UseFieldSelectorReturn = ReturnType<typeof useFieldSelector>;
