/**
 * Tests for useQuery hook
 * Tests the query state management and reducer logic
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuery, createEmptyBoolQuery } from './useQuery';
import { QueryProvider } from '@/context/QueryContext';
import type { BoolQueryNode } from '@crystal-forge/query-dsl';

/**
 * Wrapper component to provide QueryContext
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}

describe('useQuery', () => {
  describe('initial state', () => {
    it('should start with null query', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      expect(result.current.state.query.query).toBeNull();
    });

    it('should have empty aggregations array', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      expect(result.current.state.aggregations).toEqual([]);
    });
  });

  describe('setQuery', () => {
    it('should set a new query', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const newQuery = createEmptyBoolQuery();

      act(() => {
        result.current.setQuery(newQuery);
      });

      expect(result.current.state.query.query).toEqual(newQuery);
    });

    it('should replace existing query', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const query1 = createEmptyBoolQuery();
      const query2 = createEmptyBoolQuery();

      act(() => {
        result.current.setQuery(query1);
      });
      expect(result.current.state.query.query?.id).toBe(query1.id);

      act(() => {
        result.current.setQuery(query2);
      });
      expect(result.current.state.query.query?.id).toBe(query2.id);
    });
  });

  describe('resetQuery', () => {
    it('should set query to null', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const query = createEmptyBoolQuery();

      act(() => {
        result.current.setQuery(query);
      });
      expect(result.current.state.query.query).not.toBeNull();

      act(() => {
        result.current.resetQuery();
      });
      expect(result.current.state.query.query).toBeNull();
    });

    it('should clear aggregations', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });

      // Add aggregations
      act(() => {
        result.current.setAggregations([
          {
            name: 'test_agg',
            type: 'terms',
            field: 'category',
            size: 10,
          },
        ]);
      });

      expect(result.current.state.aggregations.length).toBeGreaterThan(0);

      // Reset
      act(() => {
        result.current.resetQuery();
      });

      expect(result.current.state.aggregations).toEqual([]);
    });
  });

  describe('addNode', () => {
    it('should add a node to must clause', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const boolQuery = createEmptyBoolQuery();

      act(() => {
        result.current.setQuery(boolQuery);
      });

      const newNode = {
        id: 'test-node',
        type: 'match' as const,
        field: 'title',
        value: 'test',
      };

      act(() => {
        result.current.addNode(['must'], newNode);
      });

      const queryNode = result.current.state.query.query as BoolQueryNode;
      expect(queryNode.must).toHaveLength(1);
      expect(queryNode.must[0]).toEqual(newNode);
    });

    it('should handle nested paths', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const boolQuery = createEmptyBoolQuery();

      act(() => {
        result.current.setQuery(boolQuery);
      });

      // Add a nested bool query to must
      const nestedBool: BoolQueryNode = {
        id: 'nested-bool',
        type: 'bool',
        must: [],
        should: [],
        must_not: [],
        filter: [],
      };

      act(() => {
        result.current.addNode(['must'], nestedBool);
      });

      let queryNode = result.current.state.query.query as BoolQueryNode;
      expect(queryNode.must).toHaveLength(1);
      expect((queryNode.must[0] as BoolQueryNode).type).toBe('bool');

      // Add node to nested bool
      const nodeInNested = {
        id: 'node-in-nested',
        type: 'term' as const,
        field: 'status',
        value: 'active',
      };

      act(() => {
        result.current.addNode(['must', '0', 'must'], nodeInNested);
      });

      queryNode = result.current.state.query.query as BoolQueryNode;
      const nestedBoolNode = queryNode.must[0] as BoolQueryNode;
      expect(nestedBoolNode.must).toHaveLength(1);
      expect(nestedBoolNode.must[0]).toEqual(nodeInNested);
    });
  });

  describe('removeNode', () => {
    it('should remove a node by id', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const boolQuery = createEmptyBoolQuery();

      const node = {
        id: 'test-node',
        type: 'match' as const,
        field: 'title',
        value: 'test',
      };

      boolQuery.must.push(node);

      act(() => {
        result.current.setQuery(boolQuery);
      });

      expect((result.current.state.query.query as BoolQueryNode).must).toHaveLength(1);

      act(() => {
        result.current.removeNode(['must'], 'test-node');
      });

      expect((result.current.state.query.query as BoolQueryNode).must).toHaveLength(0);
    });
  });

  describe('updateNode', () => {
    it('should update node properties', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });
      const boolQuery = createEmptyBoolQuery();

      const node = {
        id: 'test-node',
        type: 'match' as const,
        field: 'title',
        value: 'original',
      };

      boolQuery.must.push(node);

      act(() => {
        result.current.setQuery(boolQuery);
      });

      act(() => {
        result.current.updateNode(['must', '0'], 'test-node', {
          value: 'updated',
        });
      });

      const updatedNode = (result.current.state.query.query as BoolQueryNode).must[0];
      expect((updatedNode as any).value).toBe('updated');
    });
  });

  describe('setAggregations', () => {
    it('should set aggregations', () => {
      const { result } = renderHook(() => useQuery(), { wrapper });

      const aggregations = [
        {
          name: 'categories',
          type: 'terms' as const,
          field: 'category',
          size: 20,
        },
      ];

      act(() => {
        result.current.setAggregations(aggregations);
      });

      expect(result.current.state.aggregations).toEqual(aggregations);
    });
  });
});
