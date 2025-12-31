import { describe, it, expect, beforeEach } from 'vitest';
import {
  deserializeQuery,
  deserializeQueryState,
  deserializeFromJson,
  resetNodeIdCounter,
  generateNodeId,
} from '../deserializer';
import type {
  MatchPhraseQueryNode,
  MatchPhrasePrefixQueryNode,
  TermsQueryNode,
  RegexpQueryNode,
  MatchNoneQueryNode,
  SimpleQueryStringQueryNode,
  NestedQueryNode,
  QueryStringQueryNode,
} from '../types';

describe('deserializeQuery', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  describe('match queries', () => {
    it('deserializes a basic match query', () => {
      const query = {
        match: {
          title: { query: 'hello world' },
        },
      };

      const result = deserializeQuery(query);
      expect(result.type).toBe('match');
      expect(result).toHaveProperty('field', 'title');
      expect(result).toHaveProperty('value', 'hello world');
    });

    it('deserializes match query with fuzzy_transpositions and auto_generate_synonyms_phrase_query', () => {
      const query = {
        match: {
          title: {
            query: 'test',
            fuzzy_transpositions: false,
            auto_generate_synonyms_phrase_query: true,
          },
        },
      };

      const result = deserializeQuery(query);
      expect(result.type).toBe('match');
      expect(result).toHaveProperty('fuzzy_transpositions', false);
      expect(result).toHaveProperty('auto_generate_synonyms_phrase_query', true);
    });
  });

  describe('match_phrase queries', () => {
    it('deserializes a match_phrase query', () => {
      const query = {
        match_phrase: {
          content: { query: 'quick brown fox', slop: 2 },
        },
      };

      const result = deserializeQuery(query) as MatchPhraseQueryNode;
      expect(result.type).toBe('match_phrase');
      expect(result.field).toBe('content');
      expect(result.value).toBe('quick brown fox');
      expect(result.slop).toBe(2);
    });

    it('deserializes match_phrase with shorthand string value', () => {
      const query = {
        match_phrase: {
          content: 'quick brown fox',
        },
      };

      const result = deserializeQuery(query) as MatchPhraseQueryNode;
      expect(result.type).toBe('match_phrase');
      expect(result.value).toBe('quick brown fox');
    });
  });

  describe('match_phrase_prefix queries', () => {
    it('deserializes a match_phrase_prefix query', () => {
      const query = {
        match_phrase_prefix: {
          title: { query: 'quick bro', max_expansions: 50 },
        },
      };

      const result = deserializeQuery(query) as MatchPhrasePrefixQueryNode;
      expect(result.type).toBe('match_phrase_prefix');
      expect(result.value).toBe('quick bro');
      expect(result.max_expansions).toBe(50);
    });
  });

  describe('terms queries', () => {
    it('deserializes a terms query', () => {
      const query = {
        terms: {
          status: ['active', 'pending', 'published'],
        },
      };

      const result = deserializeQuery(query) as TermsQueryNode;
      expect(result.type).toBe('terms');
      expect(result.field).toBe('status');
      expect(result.values).toEqual(['active', 'pending', 'published']);
    });

    it('deserializes terms with boost', () => {
      const query = {
        terms: {
          status: ['active', 'pending'],
          boost: 1.5,
        },
      };

      const result = deserializeQuery(query) as TermsQueryNode;
      expect(result.type).toBe('terms');
      expect(result.values).toEqual(['active', 'pending']);
      expect(result.boost).toBe(1.5);
    });
  });

  describe('regexp queries', () => {
    it('deserializes a regexp query', () => {
      const query = {
        regexp: {
          email: {
            value: '.*@example\\.com',
            flags: 'ALL',
            case_insensitive: true,
          },
        },
      };

      const result = deserializeQuery(query) as RegexpQueryNode;
      expect(result.type).toBe('regexp');
      expect(result.field).toBe('email');
      expect(result.value).toBe('.*@example\\.com');
      expect(result.flags).toBe('ALL');
      expect(result.case_insensitive).toBe(true);
    });
  });

  describe('match_none queries', () => {
    it('deserializes a match_none query', () => {
      const query = {
        match_none: {},
      };

      const result = deserializeQuery(query) as MatchNoneQueryNode;
      expect(result.type).toBe('match_none');
    });
  });

  describe('simple_query_string queries', () => {
    it('deserializes a simple_query_string query', () => {
      const query = {
        simple_query_string: {
          query: 'foo + bar',
          fields: ['title', 'body'],
          default_operator: 'AND',
          analyze_wildcard: true,
        },
      };

      const result = deserializeQuery(query) as SimpleQueryStringQueryNode;
      expect(result.type).toBe('simple_query_string');
      expect(result.query).toBe('foo + bar');
      expect(result.fields).toEqual(['title', 'body']);
      expect(result.default_operator).toBe('AND');
      expect(result.analyze_wildcard).toBe(true);
    });
  });

  describe('query_string with time_zone', () => {
    it('deserializes query_string with time_zone', () => {
      const query = {
        query_string: {
          query: 'date:[2023-01-01 TO 2023-12-31]',
          time_zone: 'America/New_York',
        },
      };

      const result = deserializeQuery(query) as QueryStringQueryNode;
      expect(result.type).toBe('query_string');
      expect(result.time_zone).toBe('America/New_York');
    });
  });

  describe('nested queries with inner_hits', () => {
    it('deserializes nested query with inner_hits', () => {
      const query = {
        nested: {
          path: 'comments',
          query: { match_all: {} },
          inner_hits: {
            name: 'matched_comments',
            size: 5,
          },
        },
      };

      const result = deserializeQuery(query) as NestedQueryNode;
      expect(result.type).toBe('nested');
      expect(result.path).toBe('comments');
      expect(result.inner_hits).toEqual({
        name: 'matched_comments',
        size: 5,
      });
    });

    it('deserializes inner_hits with sort clause containing filter', () => {
      const query = {
        nested: {
          path: 'comments',
          query: { match_all: {} },
          inner_hits: {
            size: 10,
            sort: [
              {
                'comments.date': {
                  order: 'desc',
                  nested: {
                    path: 'comments',
                    filter: {
                      range: { 'comments.rating': { gte: 4 } },
                    },
                  },
                },
              },
            ],
          },
        },
      };

      const result = deserializeQuery(query) as NestedQueryNode;
      expect(result.inner_hits?.sort).toHaveLength(1);
      expect(result.inner_hits?.sort?.[0].field).toBe('comments.date');
      expect(result.inner_hits?.sort?.[0].nested?.filter).toBeDefined();
      expect(result.inner_hits?.sort?.[0].nested?.filter?.type).toBe('range');
    });
  });

  describe('unknown query handling', () => {
    it('returns match_all for unknown query types', () => {
      const query = {
        unknown_query_type: { foo: 'bar' },
      };

      const result = deserializeQuery(query);
      expect(result.type).toBe('match_all');
    });

    it('returns match_all for empty query object', () => {
      const result = deserializeQuery({});
      expect(result.type).toBe('match_all');
    });
  });
});

describe('deserializeQueryState', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  it('deserializes complete query state', () => {
    const body = {
      query: { match_all: {} },
      size: 20,
      from: 10,
      sort: [{ date: 'desc' }],
    };

    const result = deserializeQueryState(body);
    expect(result.query?.type).toBe('match_all');
    expect(result.size).toBe(20);
    expect(result.from).toBe(10);
    expect(result.sort).toHaveLength(1);
  });

  it('deserializes highlight with order', () => {
    const body = {
      query: { match_all: {} },
      highlight: {
        fields: { title: {}, body: {} },
        order: 'score',
      },
    };

    const result = deserializeQueryState(body);
    expect(result.highlight?.order).toBe('score');
  });
});

describe('deserializeFromJson', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  it('parses JSON string and deserializes', () => {
    const json = JSON.stringify({
      query: { match: { title: 'test' } },
      size: 10,
    });

    const result = deserializeFromJson(json);
    expect(result.query?.type).toBe('match');
    expect(result.size).toBe(10);
  });
});

describe('ID generation', () => {
  it('generates unique IDs with correct prefix', () => {
    const id1 = generateNodeId('test');
    const id2 = generateNodeId('test');
    const id3 = generateNodeId('match');

    // IDs should have correct prefixes
    expect(id1).toMatch(/^test_/);
    expect(id2).toMatch(/^test_/);
    expect(id3).toMatch(/^match_/);

    // IDs should be unique
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3);
    expect(id2).not.toBe(id3);
  });

  it('resetNodeIdCounter is a no-op (deprecated)', () => {
    // resetNodeIdCounter is deprecated and does nothing with UUID-based IDs
    const id1 = generateNodeId('test');
    resetNodeIdCounter();
    const id2 = generateNodeId('test');

    // IDs should still be unique (reset has no effect)
    expect(id1).not.toBe(id2);
  });
});
