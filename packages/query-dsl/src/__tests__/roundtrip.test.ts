import { describe, it, expect, beforeEach } from 'vitest';
import { serializeQuery, serializeQueryState } from '../serializer';
import {
  deserializeQuery,
  deserializeQueryState,
  resetNodeIdCounter,
} from '../deserializer';
import type {
  QueryNode,
  QueryState,
  MatchQueryNode,
  MatchPhraseQueryNode,
  TermsQueryNode,
  BoolQueryNode,
  NestedQueryNode,
} from '../types';

describe('roundtrip serialization/deserialization', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  function roundtrip(node: QueryNode): QueryNode {
    const serialized = serializeQuery(node);
    return deserializeQuery(serialized);
  }

  describe('basic query types', () => {
    it('roundtrips match query', () => {
      const original: MatchQueryNode = {
        id: 'match_1',
        type: 'match',
        field: 'title',
        value: 'hello world',
        operator: 'and',
        fuzziness: 'AUTO',
      };

      const result = roundtrip(original);
      expect(result.type).toBe('match');
      expect((result as MatchQueryNode).field).toBe('title');
      expect((result as MatchQueryNode).value).toBe('hello world');
      expect((result as MatchQueryNode).operator).toBe('and');
      expect((result as MatchQueryNode).fuzziness).toBe('AUTO');
    });

    it('roundtrips match_phrase query', () => {
      const original: MatchPhraseQueryNode = {
        id: 'mp_1',
        type: 'match_phrase',
        field: 'content',
        value: 'quick brown fox',
        slop: 2,
      };

      const result = roundtrip(original);
      expect(result.type).toBe('match_phrase');
      expect((result as MatchPhraseQueryNode).value).toBe('quick brown fox');
      expect((result as MatchPhraseQueryNode).slop).toBe(2);
    });

    it('roundtrips terms query', () => {
      const original: TermsQueryNode = {
        id: 'terms_1',
        type: 'terms',
        field: 'status',
        values: ['active', 'pending', 'published'],
      };

      const result = roundtrip(original);
      expect(result.type).toBe('terms');
      expect((result as TermsQueryNode).field).toBe('status');
      expect((result as TermsQueryNode).values).toEqual([
        'active',
        'pending',
        'published',
      ]);
    });
  });

  describe('compound queries', () => {
    it('roundtrips bool query with multiple clauses', () => {
      const original: BoolQueryNode = {
        id: 'bool_1',
        type: 'bool',
        must: [
          { id: 'match_1', type: 'match', field: 'title', value: 'test' },
        ],
        should: [
          { id: 'match_2', type: 'match', field: 'body', value: 'example' },
        ],
        must_not: [
          { id: 'term_1', type: 'term', field: 'status', value: 'deleted' },
        ],
        filter: [
          { id: 'range_1', type: 'range', field: 'date', gte: '2023-01-01' },
        ],
        minimum_should_match: 1,
      };

      const result = roundtrip(original) as BoolQueryNode;
      expect(result.type).toBe('bool');
      expect(result.must).toHaveLength(1);
      expect(result.should).toHaveLength(1);
      expect(result.must_not).toHaveLength(1);
      expect(result.filter).toHaveLength(1);
      expect(result.minimum_should_match).toBe(1);
    });
  });

  describe('nested queries with inner_hits', () => {
    it('roundtrips nested query with simple inner_hits', () => {
      const original: NestedQueryNode = {
        id: 'nested_1',
        type: 'nested',
        path: 'comments',
        query: { id: 'match_all_1', type: 'match_all' },
        score_mode: 'avg',
        inner_hits: {
          name: 'matched_comments',
          size: 5,
          from: 0,
        },
      };

      const result = roundtrip(original) as NestedQueryNode;
      expect(result.type).toBe('nested');
      expect(result.path).toBe('comments');
      expect(result.score_mode).toBe('avg');
      expect(result.inner_hits).toEqual({
        name: 'matched_comments',
        size: 5,
        from: 0,
      });
    });

    it('roundtrips nested query with inner_hits containing sort filter', () => {
      const original: NestedQueryNode = {
        id: 'nested_1',
        type: 'nested',
        path: 'reviews',
        query: { id: 'match_all_1', type: 'match_all' },
        inner_hits: {
          size: 10,
          sort: [
            {
              field: 'reviews.date',
              order: 'desc',
              nested: {
                path: 'reviews',
                filter: {
                  id: 'range_1',
                  type: 'range',
                  field: 'reviews.rating',
                  gte: 4,
                },
              },
            },
          ],
        },
      };

      const result = roundtrip(original) as NestedQueryNode;
      expect(result.inner_hits?.sort).toHaveLength(1);
      expect(result.inner_hits?.sort?.[0].field).toBe('reviews.date');
      expect(result.inner_hits?.sort?.[0].order).toBe('desc');
      expect(result.inner_hits?.sort?.[0].nested?.path).toBe('reviews');
      expect(result.inner_hits?.sort?.[0].nested?.filter?.type).toBe('range');
    });
  });

  describe('query state roundtrip', () => {
    function roundtripState(state: QueryState): QueryState {
      const serialized = serializeQueryState(state);
      return deserializeQueryState(serialized);
    }

    it('roundtrips complete query state', () => {
      const original: QueryState = {
        query: { id: 'match_all_1', type: 'match_all' },
        size: 25,
        from: 50,
        sort: [
          { field: 'date', order: 'desc' },
          { field: '_score', order: 'desc' },
        ],
        timeout: '30s',
        explain: true,
        track_total_hits: true,
        min_score: 0.5,
      };

      const result = roundtripState(original);
      expect(result.query?.type).toBe('match_all');
      expect(result.size).toBe(25);
      expect(result.from).toBe(50);
      expect(result.sort).toHaveLength(2);
      expect(result.timeout).toBe('30s');
      expect(result.explain).toBe(true);
      expect(result.track_total_hits).toBe(true);
      expect(result.min_score).toBe(0.5);
    });

    it('roundtrips query state with highlight', () => {
      const original: QueryState = {
        query: { id: 'match_1', type: 'match', field: 'title', value: 'test' },
        highlight: {
          fields: { title: { number_of_fragments: 3 }, body: {} },
          pre_tags: ['<em>'],
          post_tags: ['</em>'],
          order: 'score',
        },
      };

      const result = roundtripState(original);
      expect(result.highlight?.fields).toHaveProperty('title');
      expect(result.highlight?.pre_tags).toEqual(['<em>']);
      expect(result.highlight?.post_tags).toEqual(['</em>']);
      expect(result.highlight?.order).toBe('score');
    });
  });
});
