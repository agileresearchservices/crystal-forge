import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeQuery,
  serializeQueryState,
  serializeToJson,
} from '../serializer';
import type {
  BoolQueryNode,
  MatchQueryNode,
  MatchPhraseQueryNode,
  MatchPhrasePrefixQueryNode,
  TermQueryNode,
  TermsQueryNode,
  RangeQueryNode,
  RegexpQueryNode,
  MatchAllQueryNode,
  MatchNoneQueryNode,
  SimpleQueryStringQueryNode,
  NestedQueryNode,
  QueryState,
} from '../types';

describe('serializeQuery', () => {
  describe('match queries', () => {
    it('serializes a basic match query using shorthand format', () => {
      const node: MatchQueryNode = {
        id: 'match_1',
        type: 'match',
        field: 'title',
        value: 'hello world',
      };

      // Basic match queries use shorthand format (just the value)
      expect(serializeQuery(node)).toEqual({
        match: {
          title: 'hello world',
        },
      });
    });

    it('serializes match query with all parameters', () => {
      const node: MatchQueryNode = {
        id: 'match_1',
        type: 'match',
        field: 'title',
        value: 'hello',
        operator: 'and',
        fuzziness: 'AUTO',
        fuzzy_transpositions: true,
        auto_generate_synonyms_phrase_query: false,
        boost: 2.0,
      };

      const result = serializeQuery(node);
      expect(result.match.title).toMatchObject({
        query: 'hello',
        operator: 'and',
        fuzziness: 'AUTO',
        fuzzy_transpositions: true,
        auto_generate_synonyms_phrase_query: false,
        boost: 2.0,
      });
    });
  });

  describe('match_phrase queries', () => {
    it('serializes a match_phrase query', () => {
      const node: MatchPhraseQueryNode = {
        id: 'match_phrase_1',
        type: 'match_phrase',
        field: 'content',
        value: 'quick brown fox',
      };

      expect(serializeQuery(node)).toEqual({
        match_phrase: {
          content: { query: 'quick brown fox' },
        },
      });
    });

    it('serializes match_phrase with slop', () => {
      const node: MatchPhraseQueryNode = {
        id: 'match_phrase_1',
        type: 'match_phrase',
        field: 'content',
        value: 'quick fox',
        slop: 2,
        analyzer: 'english',
      };

      const result = serializeQuery(node);
      expect(result.match_phrase.content).toMatchObject({
        query: 'quick fox',
        slop: 2,
        analyzer: 'english',
      });
    });
  });

  describe('match_phrase_prefix queries', () => {
    it('serializes a match_phrase_prefix query', () => {
      const node: MatchPhrasePrefixQueryNode = {
        id: 'mpp_1',
        type: 'match_phrase_prefix',
        field: 'title',
        value: 'quick bro',
        max_expansions: 50,
      };

      const result = serializeQuery(node);
      expect(result.match_phrase_prefix.title).toMatchObject({
        query: 'quick bro',
        max_expansions: 50,
      });
    });
  });

  describe('term queries', () => {
    it('serializes a term query with case_insensitive', () => {
      const node: TermQueryNode = {
        id: 'term_1',
        type: 'term',
        field: 'status',
        value: 'Active',
        case_insensitive: true,
      };

      expect(serializeQuery(node)).toEqual({
        term: {
          status: { value: 'Active', case_insensitive: true },
        },
      });
    });
  });

  describe('terms queries', () => {
    it('serializes a terms query', () => {
      const node: TermsQueryNode = {
        id: 'terms_1',
        type: 'terms',
        field: 'status',
        values: ['active', 'pending', 'published'],
      };

      expect(serializeQuery(node)).toEqual({
        terms: {
          status: ['active', 'pending', 'published'],
        },
      });
    });

    it('serializes terms with boost', () => {
      const node: TermsQueryNode = {
        id: 'terms_1',
        type: 'terms',
        field: 'tags',
        values: ['javascript', 'typescript'],
        boost: 1.5,
      };

      expect(serializeQuery(node)).toEqual({
        terms: {
          tags: ['javascript', 'typescript'],
          boost: 1.5,
        },
      });
    });
  });

  describe('regexp queries', () => {
    it('serializes a regexp query', () => {
      const node: RegexpQueryNode = {
        id: 'regexp_1',
        type: 'regexp',
        field: 'email',
        value: '.*@example\\.com',
        flags: 'ALL',
        case_insensitive: true,
      };

      expect(serializeQuery(node)).toEqual({
        regexp: {
          email: {
            value: '.*@example\\.com',
            flags: 'ALL',
            case_insensitive: true,
          },
        },
      });
    });
  });

  describe('match_none queries', () => {
    it('serializes a match_none query', () => {
      const node: MatchNoneQueryNode = {
        id: 'match_none_1',
        type: 'match_none',
      };

      expect(serializeQuery(node)).toEqual({
        match_none: {},
      });
    });
  });

  describe('simple_query_string queries', () => {
    it('serializes a simple_query_string query', () => {
      const node: SimpleQueryStringQueryNode = {
        id: 'sqs_1',
        type: 'simple_query_string',
        query: 'foo + bar',
        fields: ['title', 'body'],
        default_operator: 'AND',
      };

      expect(serializeQuery(node)).toEqual({
        simple_query_string: {
          query: 'foo + bar',
          fields: ['title', 'body'],
          default_operator: 'AND',
        },
      });
    });
  });

  describe('bool queries', () => {
    it('returns match_all for empty bool query', () => {
      const node: BoolQueryNode = {
        id: 'bool_1',
        type: 'bool',
        must: [],
        should: [],
        must_not: [],
        filter: [],
      };

      expect(serializeQuery(node)).toEqual({
        match_all: {},
      });
    });

    it('serializes bool with clauses', () => {
      const node: BoolQueryNode = {
        id: 'bool_1',
        type: 'bool',
        must: [
          { id: 'match_1', type: 'match', field: 'title', value: 'test' },
        ],
        should: [],
        must_not: [],
        filter: [],
      };

      const result = serializeQuery(node);
      expect(result.bool.must).toHaveLength(1);
      // Match query uses shorthand format when no options are specified
      expect(result.bool.must[0].match.title).toBe('test');
    });
  });

  describe('nested queries with inner_hits', () => {
    it('serializes nested query with inner_hits', () => {
      const node: NestedQueryNode = {
        id: 'nested_1',
        type: 'nested',
        path: 'comments',
        query: {
          id: 'match_1',
          type: 'match',
          field: 'comments.text',
          value: 'great',
        },
        inner_hits: {
          name: 'matched_comments',
          size: 5,
        },
      };

      const result = serializeQuery(node);
      expect(result.nested.inner_hits).toEqual({
        name: 'matched_comments',
        size: 5,
      });
    });

    it('serializes inner_hits with sort clause containing filter', () => {
      const node: NestedQueryNode = {
        id: 'nested_1',
        type: 'nested',
        path: 'comments',
        query: {
          id: 'match_all_1',
          type: 'match_all',
        },
        inner_hits: {
          size: 10,
          sort: [
            {
              field: 'comments.date',
              order: 'desc',
              nested: {
                path: 'comments',
                filter: {
                  id: 'range_1',
                  type: 'range',
                  field: 'comments.rating',
                  gte: 4,
                },
              },
            },
          ],
        },
      };

      const result = serializeQuery(node);
      expect(result.nested.inner_hits.sort).toHaveLength(1);
      expect(result.nested.inner_hits.sort[0]['comments.date'].nested).toEqual({
        path: 'comments',
        filter: { range: { 'comments.rating': { gte: 4 } } },
      });
    });
  });
});

describe('serializeQueryState', () => {
  it('serializes complete query state', () => {
    const state: QueryState = {
      query: { id: 'match_all_1', type: 'match_all' },
      size: 20,
      from: 10,
      sort: [{ field: 'date', order: 'desc' }],
    };

    const result = serializeQueryState(state);
    expect(result.query).toEqual({ match_all: {} });
    expect(result.size).toBe(20);
    expect(result.from).toBe(10);
    expect(result.sort).toHaveLength(1);
  });

  it('serializes highlight with order', () => {
    const state: QueryState = {
      query: { id: 'match_1', type: 'match', field: 'title', value: 'test' },
      highlight: {
        fields: { title: {}, body: {} },
        order: 'score',
      },
    };

    const result = serializeQueryState(state);
    expect(result.highlight?.order).toBe('score');
  });
});

describe('serializeToJson', () => {
  it('returns formatted JSON string', () => {
    const state: QueryState = {
      query: { id: 'match_all_1', type: 'match_all' },
    };

    const json = serializeToJson(state);
    expect(json).toContain('match_all');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
