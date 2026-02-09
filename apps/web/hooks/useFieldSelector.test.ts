import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFieldSelector } from './useFieldSelector';
import type { FieldInfo } from '@crystal-forge/opensearch-client';

describe('useFieldSelector', () => {
  const mockFields: FieldInfo[] = [
    {
      name: 'title',
      path: 'title',
      type: 'text',
      searchable: true,
      aggregatable: false,
      isNested: false,
      isMultiField: false,
    },
    {
      name: 'price',
      path: 'price',
      type: 'long',
      searchable: false,
      aggregatable: true,
      isNested: false,
      isMultiField: false,
    },
    {
      name: 'category',
      path: 'category.keyword',
      type: 'keyword',
      searchable: true,
      aggregatable: true,
      isNested: false,
      isMultiField: true,
    },
    {
      name: 'metadata',
      path: 'metadata.author',
      type: 'text',
      searchable: true,
      aggregatable: false,
      isNested: true,
      isMultiField: false,
    },
    {
      name: 'nested_author',
      path: 'metadata.nested_author',
      type: 'keyword',
      searchable: false,
      aggregatable: true,
      isNested: true,
      isMultiField: false,
    },
  ];

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      expect(result.current.selectedField).toBeNull();
      expect(result.current.fieldSearch).toBe('');
    });

    it('should have all fields initially', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      expect(result.current.filteredFields).toHaveLength(mockFields.length);
    });
  });

  describe('field search', () => {
    it('should filter fields by name', () => {
      const { result, rerender } = renderHook(
        ({ fields }) => useFieldSelector(fields),
        { initialProps: { fields: mockFields } }
      );

      act(() => {
        result.current.setFieldSearch('title');
      });

      expect(result.current.filteredFields).toHaveLength(1);
      expect(result.current.filteredFields[0].name).toBe('title');
    });

    it('should filter fields by path', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('metadata');
      });

      expect(result.current.filteredFields).toHaveLength(2);
      expect(result.current.filteredFields.every((f) => f.path.includes('metadata'))).toBe(true);
    });

    it('should filter fields by type', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('keyword');
      });

      expect(result.current.filteredFields).toHaveLength(2);
      expect(result.current.filteredFields.every((f) => f.type === 'keyword')).toBe(true);
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('TITLE');
      });

      expect(result.current.filteredFields).toHaveLength(1);
      expect(result.current.filteredFields[0].name).toBe('title');
    });

    it('should return all fields when search is empty', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('title');
      });

      expect(result.current.filteredFields).toHaveLength(1);

      act(() => {
        result.current.setFieldSearch('');
      });

      expect(result.current.filteredFields).toHaveLength(mockFields.length);
    });

    it('should handle whitespace-only search', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('   ');
      });

      expect(result.current.filteredFields).toHaveLength(mockFields.length);
    });
  });

  describe('field selection', () => {
    it('should select a field', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setSelectedField(mockFields[0]);
      });

      expect(result.current.selectedField).toEqual(mockFields[0]);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setSelectedField(mockFields[0]);
      });

      expect(result.current.selectedField).not.toBeNull();

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedField).toBeNull();
    });
  });

  describe('field grouping', () => {
    it('should group fields by root path segment', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      expect(Object.keys(result.current.groupedFields)).toContain('title');
      expect(Object.keys(result.current.groupedFields)).toContain('price');
      expect(Object.keys(result.current.groupedFields)).toContain('category');
      expect(Object.keys(result.current.groupedFields)).toContain('metadata');
    });

    it('should group nested fields together', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      const metadataGroup = result.current.groupedFields['metadata'];
      expect(metadataGroup).toHaveLength(2);
      expect(metadataGroup.map((f) => f.name)).toContain('metadata');
      expect(metadataGroup.map((f) => f.name)).toContain('nested_author');
    });

    it('should respect filtered fields in grouping', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('keyword');
      });

      expect(result.current.groupedFields['category']).toHaveLength(1);
      expect(result.current.groupedFields['metadata']).toHaveLength(1);
      expect(result.current.groupedFields['metadata'][0].name).toBe('nested_author');
    });
  });

  describe('getFieldsByType', () => {
    it('should return fields of specific type', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      const keywordFields = result.current.getFieldsByType('keyword');

      expect(keywordFields).toHaveLength(2);
      expect(keywordFields.every((f) => f.type === 'keyword')).toBe(true);
    });

    it('should respect filtered fields', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('metadata');
      });

      const keywords = result.current.getFieldsByType('keyword');
      expect(keywords).toHaveLength(1);
      expect(keywords[0].name).toBe('nested_author');
    });

    it('should return empty array for non-existent type', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      const fields = result.current.getFieldsByType('geo_point');
      expect(fields).toHaveLength(0);
    });
  });

  describe('searchableFields', () => {
    it('should return only searchable fields', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      expect(result.current.searchableFields).toHaveLength(3);
      expect(result.current.searchableFields.every((f) => f.searchable)).toBe(true);
    });

    it('should respect field search filter', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('keyword');
      });

      expect(result.current.searchableFields).toHaveLength(1);
      expect(result.current.searchableFields[0].name).toBe('category');
    });
  });

  describe('aggregatableFields', () => {
    it('should return only aggregatable fields', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      expect(result.current.aggregatableFields).toHaveLength(3);
      expect(result.current.aggregatableFields.every((f) => f.aggregatable)).toBe(true);
    });

    it('should respect field search filter', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('text');
      });

      expect(result.current.aggregatableFields).toHaveLength(0);
    });
  });

  describe('clearSearch', () => {
    it('should clear search term', () => {
      const { result } = renderHook(() => useFieldSelector(mockFields));

      act(() => {
        result.current.setFieldSearch('title');
      });

      expect(result.current.fieldSearch).toBe('title');
      expect(result.current.filteredFields).toHaveLength(1);

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.fieldSearch).toBe('');
      expect(result.current.filteredFields).toHaveLength(mockFields.length);
    });
  });

  describe('dynamic field updates', () => {
    it('should update when fields prop changes', () => {
      const initialFields = mockFields.slice(0, 2);
      const { result, rerender } = renderHook(
        ({ fields }) => useFieldSelector(fields),
        { initialProps: { fields: initialFields } }
      );

      expect(result.current.filteredFields).toHaveLength(2);

      act(() => {
        rerender({ fields: mockFields });
      });

      expect(result.current.filteredFields).toHaveLength(mockFields.length);
    });

    it('should maintain search term when fields change', () => {
      const initialFields = mockFields.slice(0, 2);
      const { result, rerender } = renderHook(
        ({ fields }) => useFieldSelector(fields),
        { initialProps: { fields: initialFields } }
      );

      act(() => {
        result.current.setFieldSearch('keyword');
      });

      // With initial fields, no match
      expect(result.current.filteredFields).toHaveLength(0);

      // Rerender with full fields
      act(() => {
        rerender({ fields: mockFields });
      });

      // Now should find matches
      expect(result.current.filteredFields).toHaveLength(2);
      expect(result.current.fieldSearch).toBe('keyword');
    });
  });

  describe('empty fields', () => {
    it('should handle empty field list', () => {
      const { result } = renderHook(() => useFieldSelector([]));

      expect(result.current.filteredFields).toHaveLength(0);
      expect(result.current.searchableFields).toHaveLength(0);
      expect(result.current.aggregatableFields).toHaveLength(0);
      expect(Object.keys(result.current.groupedFields)).toHaveLength(0);
    });
  });
});
