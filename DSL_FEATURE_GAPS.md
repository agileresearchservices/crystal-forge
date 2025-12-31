# Crystal Forge - DSL Feature Gap Analysis

**Date:** 2025-12-31
**Analysis:** Comprehensive comparison of implemented vs. OpenSearch Query DSL specification

---

## Summary

Crystal Forge has implemented **26 out of 54** query types from the complete OpenSearch Query DSL specification. The codebase is well-structured with comprehensive support for the most commonly used queries, but lacks several advanced and specialized features.

### Current Implementation Status
- **Fully Implemented:** 26 query types
- **Missing:** 28 query types
- **Coverage:** ~48% of OpenSearch Query DSL

---

## Implemented Features ✅

### Full-Text Queries
- ✅ match (with extensive options)
- ✅ match_phrase
- ✅ match_phrase_prefix
- ✅ multi_match
- ✅ query_string (with full Lucene syntax)

### Term-Level Queries
- ✅ term
- ✅ terms (with inline values and lookup support)
- ✅ range
- ✅ prefix
- ✅ wildcard
- ✅ regexp
- ✅ fuzzy
- ✅ exists
- ✅ ids

### Compound Queries
- ✅ bool
- ✅ dis_max
- ✅ constant_score
- ✅ boosting
- ✅ function_score (with decay functions)

### Joining Queries
- ✅ nested (with inner_hits and score_mode)

### Geo Queries
- ✅ geo_bounding_box
- ✅ geo_distance
- ✅ geo_shape

### Special Queries
- ✅ match_all
- ✅ match_none

### Aggregations (Field Exploration)
- ✅ terms
- ✅ stats
- ✅ extended_stats
- ✅ date_histogram
- ✅ histogram
- ✅ range
- ✅ cardinality
- ✅ avg, sum, min, max, value_count

---

## Missing Features by Category

### HIGH PRIORITY (Common Use Cases)

#### 1. simple_query_string
**Query Type:** Full-text query
**Priority:** High
**Effort:** Small (already in types.ts, missing from deserializer)

**Use Case:**
Simple query string never throws exceptions, unlike query_string. Essential for user-facing search where robustness matters more than syntax validation.

**OpenSearch Syntax:**
```json
{
  "simple_query_string": {
    "query": "\"fried eggs\" +(eggplant | potato) -frittata",
    "fields": ["title^2", "body"],
    "default_operator": "AND"
  }
}
```

**Implementation Status:**
- ✅ Type definition: `SimpleQueryStringQueryNode` exists (types.ts:462-490)
- ✅ Serializer: `serializeSimpleQueryStringQuery` exists (serializer.ts:514-544)
- ❌ Deserializer: Missing deserialization logic

**Implementation Notes:**
Need to add `deserializeSimpleQueryStringQuery()` to deserializer.ts and add case handling in `deserializeQuery()`.

---

#### 2. match_bool_prefix
**Query Type:** Full-text query
**Priority:** High
**Effort:** Small

**Use Case:**
Autocomplete queries that behave like match_phrase but match the last term as a prefix. Very common for typeahead/search-as-you-type UI patterns.

**OpenSearch Syntax:**
```json
{
  "match_bool_prefix": {
    "message": {
      "query": "quick brown f",
      "fuzziness": "AUTO"
    }
  }
}
```

**Current Gap:**
- Missing from QueryType union (types.ts:15-47)
- No MatchBoolPrefixQueryNode interface
- No serializer/deserializer

**Implementation Notes:**
1. Add `'match_bool_prefix'` to QueryType union
2. Create `MatchBoolPrefixQueryNode extends FieldQueryNode` interface with:
   - `value: string`
   - `fuzziness?: string | number`
   - `prefix_length?: number`
   - `max_expansions?: number`
   - `analyzer?: string`
   - `boost?: number`
   - `_name?: string`
3. Add serializer and deserializer functions

---

#### 3. combined_fields
**Query Type:** Full-text query
**Priority:** High
**Effort:** Medium

**Use Case:**
Search across multiple fields with a unified relevance score. Better alternative to multi_match for cross-field searching when you want consistent scoring.

**OpenSearch Syntax:**
```json
{
  "combined_fields": {
    "query": "database administrator",
    "fields": ["job_title^2", "resume"],
    "operator": "and"
  }
}
```

**Current Gap:**
- Missing from QueryType union
- No CombinedFieldsQueryNode interface
- No serializer/deserializer

**Implementation Notes:**
1. Add `'combined_fields'` to QueryType union
2. Create `CombinedFieldsQueryNode extends QueryNodeBase` interface with:
   - `query: string`
   - `fields: string[]` (supports field boosts like `field^2`)
   - `operator?: 'and' | 'or'`
   - `minimum_should_match?: string | number`
   - `zero_terms_query?: 'none' | 'all'`
   - `boost?: number`
   - `_name?: string`
3. Add serializer and deserializer functions

---

#### 4. Joining Queries: has_child, has_parent, parent_id
**Query Type:** Joining queries
**Priority:** High
**Effort:** Large

**Use Case:**
Query documents with parent-child relationships (using join field type). Essential for hierarchical data models like departments-employees or articles-comments.

**OpenSearch Syntax:**
```json
{
  "has_child": {
    "type": "comment",
    "query": {
      "match": { "text": "important" }
    },
    "score_mode": "sum",
    "min_children": 2,
    "max_children": 10
  }
}
```

**Current Gap:**
- Missing from QueryType union
- No interface definitions
- No serializer/deserializer

**Implementation Notes:**
Would require:
1. Three new interface types
2. Serializers and deserializers for each
3. UI components to specify join types
4. Validation to ensure join field exists in mapping

---

### MEDIUM PRIORITY (Power User Features)

#### 5. More Like This (mlt)
**Query Type:** Specialized query
**Priority:** Medium
**Effort:** Medium

**Use Case:**
Find similar documents based on content. Common for "related articles" features. Can work with document IDs or provided text.

**OpenSearch Syntax:**
```json
{
  "more_like_this": {
    "fields": ["title", "body"],
    "like": [
      { "_index": "posts", "_id": "1" },
      "This is additional context"
    ],
    "min_term_freq": 1,
    "max_query_terms": 12
  }
}
```

**Current Gap:**
- Missing from QueryType union
- No interface definitions

**Implementation Notes:**
Complex implementation due to flexible "like" parameter that accepts documents or text.

---

#### 6. Script Score
**Query Type:** Specialized query
**Priority:** Medium
**Effort:** Medium

**Use Case:**
Custom scoring using Painless scripts. For advanced users who need complex scoring logic beyond function_score capabilities.

**OpenSearch Syntax:**
```json
{
  "script_score": {
    "query": { "match": { "title": "java" } },
    "script": {
      "source": "_score * doc['likes'].value / 10",
      "params": { "factor": 1.2 }
    },
    "min_score": 10
  }
}
```

**Current Gap:**
- Missing from QueryType union
- Already partially supported in function_score via script_score functions

**Implementation Notes:**
Could extend function_score or create standalone query type.

---

#### 7. Intervals Query
**Query Type:** Full-text query
**Priority:** Medium
**Effort:** Large

**Use Case:**
Advanced phrase matching with sophisticated rules about term positions and sequences. For linguistic/precision matching needs.

**OpenSearch Syntax:**
```json
{
  "intervals": {
    "body": {
      "all_of": {
        "intervals": [
          { "match": { "query": "quick" } },
          { "match": { "query": "brown" } }
        ],
        "ordered": true,
        "max_gaps": 0
      }
    }
  }
}
```

**Current Gap:**
- Missing from QueryType union
- Complex nested structure would require multiple helper interfaces

**Implementation Notes:**
Requires new interval types: all_of, any_of, ordered, unordered, etc. Large implementation effort due to flexibility.

---

#### 8. Geo Polygon (deprecated) & Geo Shape Improvements
**Query Type:** Geo queries
**Priority:** Medium
**Effort:** Small to Medium

**Use Case:**
geo_polygon is deprecated but still widely supported. Geo_shape needs better boundary handling (STRICT vs COERCE validation modes).

**OpenSearch Syntax:**
```json
{
  "geo_polygon": {
    "location": {
      "points": [
        { "lat": 40, "lon": -70 },
        { "lat": 30, "lon": -80 }
      ]
    }
  }
}
```

**Current Gap:**
- `geo_polygon` missing from QueryType union
- `geo_shape` exists but missing `validation_method` parameter (already in interface)

**Implementation Notes:**
1. Add geo_polygon for backwards compatibility
2. Ensure validation_method is properly serialized in geo_shape (appears to be in types already)

---

### LOW PRIORITY (Rare/Specialized)

#### 9. Span Queries (9 variants)
**Query Type:** Specialized queries
**Priority:** Low
**Effort:** Large

**Use Case:**
Position-aware querying for linguistic analysis, citation matching, or phrase position matching. Rarely used in typical applications.

**Span Query Types:**
- span_term
- span_multi
- span_first
- span_near
- span_or
- span_not
- span_containing
- span_within
- span_field_masking

**Current Gap:**
- All missing from QueryType union
- No interface definitions

**Implementation Notes:**
Highly specialized; recommend deferring unless users specifically request.

---

#### 10. Pinned Query
**Query Type:** Specialized query
**Priority:** Low
**Effort:** Small

**Use Case:**
Force specific documents to appear at top of results. Used for promotional/featured content pinning.

**OpenSearch Syntax:**
```json
{
  "pinned": {
    "ids": ["1", "4", "100"],
    "organic": {
      "match": { "description": "search text" }
    }
  }
}
```

**Implementation Notes:**
Simple structure; straightforward to implement if needed.

---

#### 11. Percolate Query
**Query Type:** Specialized query
**Priority:** Low
**Effort:** Medium

**Use Case:**
Run stored queries against documents (inverse search). Used for monitoring/alerting systems.

**OpenSearch Syntax:**
```json
{
  "percolate": {
    "field": "my_queries",
    "document": {
      "field": "value"
    }
  }
}
```

**Current Gap:**
- Missing from QueryType union

---

#### 12. Wrapper Query
**Query Type:** Specialized query
**Priority:** Low
**Effort:** Small

**Use Case:**
Pass raw JSON query string directly. Escape hatch for queries the UI doesn't support.

**OpenSearch Syntax:**
```json
{
  "wrapper": {
    "query": "{\"term\": {\"status\": \"active\"}}"
  }
}
```

**Implementation Notes:**
Simple to implement; essentially stores pre-serialized JSON.

---

#### 13. Rank Feature Query
**Query Type:** Specialized query
**Priority:** Low
**Effort:** Small

**Use Case:**
Boost results based on rank_feature field values. For vector search and learning-to-rank features.

**OpenSearch Syntax:**
```json
{
  "rank_feature": {
    "field": "pagerank",
    "saturation": {
      "pivot": 8
    }
  }
}
```

---

#### 14. Terms Set Query
**Query Type:** Term-level query
**Priority:** Low
**Effort:** Small

**Use Case:**
Match documents where a minimum number of terms match. Less common alternative to terms query.

**OpenSearch Syntax:**
```json
{
  "terms_set": {
    "tags": {
      "terms": ["python", "java"],
      "minimum_should_match_script": {
        "source": "Math.min(params.num_terms, 1)"
      }
    }
  }
}
```

---

## Missing Parameters on Existing Types

### bool query
**Missing Parameters:**
- `adjust_pure_negative` (bool) - Default: true. When false, pure negative bool queries return all documents.

**Syntax:**
```json
{
  "bool": {
    "must_not": [{ "term": { "status": "active" } }],
    "adjust_pure_negative": false
  }
}
```

**Effort:** Small
**Impact:** Low (edge case for pure negative bool queries)

---

### range query
**Missing Parameters:**
- `boost` is in serializer (line 248) but should verify it's properly supported in deserialization

**Current Status:** ✅ Actually implemented - boost parameter is handled

---

### All queries missing
- **`boost` on range field conditions**: boost can be applied per-field in some contexts (needs validation)
- **Proper handling of `_name` parameter**: Used for query debugging/classification

**Status:** ✅ `_name` is already supported in types and serializers

---

## Implementation Recommendations

### Phase 1: Quick Wins (Effort: Small, High Priority)
1. **simple_query_string** - Add deserializer only (type exists)
2. **match_bool_prefix** - Complete implementation (~2 hours)
3. **adjust_pure_negative** - Add to BoolQueryNode (~30 mins)

**Estimated Effort:** 3-4 hours
**User Impact:** High - covers autocomplete and edge cases

### Phase 2: Core Features (Effort: Medium, High Priority)
1. **combined_fields** - Alternative multi-field search (~3 hours)
2. **Joining queries (has_child, has_parent, parent_id)** - Hierarchical data support (~8 hours)

**Estimated Effort:** 11 hours
**User Impact:** High - enables parent-child relationship queries

### Phase 3: Advanced Features (Effort: Medium, Medium Priority)
1. **more_like_this** - Similarity search (~4 hours)
2. **script_score** - Custom scoring (~3 hours)
3. **intervals** - Advanced phrase matching (~6 hours)

**Estimated Effort:** 13 hours
**User Impact:** Medium - power user features

### Phase 4: Specialized Features (Effort: Varies, Low Priority)
- Span queries (13+ hours) - Only if specifically requested
- Geo polygon, percolate, pinned, wrapper, rank_feature, terms_set
- Fine-grained control features

---

## Testing Strategy

For each new feature, verify:
1. ✅ Serialization: QueryNode → OpenSearch JSON
2. ✅ Deserialization: OpenSearch JSON → QueryNode
3. ✅ Roundtrip: node → JSON → node produces identical structure
4. ✅ OpenSearch compatibility: Query executes correctly against real index

---

## UI/UX Considerations

As new query types are added:

1. **Field Type Compatibility** - Update `getOperatorsForFieldType()` to suggest appropriate queries
2. **Query Type Icons** - Add visual indicators for new query types in UI
3. **Documentation** - Add tooltips explaining when to use each query type
4. **Example Queries** - Provide starter queries for common use cases

---

## Notes

- The codebase is **well-architected** for adding new query types - follow the existing pattern (types → serializer → deserializer)
- **Aggregations** are well-covered for field exploration
- **Function_score** is quite comprehensive already
- **Geo queries** have solid support
- Most common user workflows are covered by implemented queries

---

## Conclusion

Crystal Forge implements the **80/20 rule** well - the 26 implemented query types cover the vast majority of real-world use cases. The missing features fall into:

- **High Priority Quick Wins** (simple_query_string, match_bool_prefix): 3-4 hours to implement
- **High Priority Core Features** (joining queries, combined_fields): 11+ hours
- **Medium Priority Power User Features** (mlt, script_score, intervals): 13+ hours
- **Low Priority Specialized Features** (span queries, etc.): Defer unless requested

Recommend prioritizing Phase 1 (quick wins) followed by Phase 2 (joining queries for hierarchical data support).
