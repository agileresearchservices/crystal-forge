# OpenSearch Feature Gaps & Enhancement Opportunities

**Last Updated:** 2026-01-01
**Document Type:** Strategic Planning / Product Roadmap

---

## Executive Summary

Crystal Forge has **excellent core coverage** of basic-to-intermediate OpenSearch features, with 40+ query types, 30+ field types, and 11 aggregation types. However, there are significant gaps in advanced capabilities that prevent power users from building sophisticated search applications.

**Key Gaps:**
1. Script-based queries & scoring (0% coverage)
2. Advanced aggregations (50% coverage)
3. Performance debugging tools (0% coverage)
4. Query reusability & templates (0% coverage)
5. Advanced result processing (field collapse, rescore missing)

---

## Current OpenSearch Feature Coverage

### What's Implemented ✅

**Query Types (40+ supported)**
- Full-text: match, match_phrase, match_phrase_prefix, multi_match, query_string, simple_query_string
- Term-level: term, terms, range, prefix, wildcard, regexp, fuzzy, exists, ids
- Compound: bool, dis_max, constant_score, boosting, function_score
- Joining: nested (with inner_hits)
- Geo: geo_bounding_box, geo_distance, geo_shape
- Special: match_all, match_none

**Field Types (30+ supported)**
- Text: text, keyword, completion, search_as_you_type, token_count
- Numeric: long, integer, short, byte, double, float, half_float, scaled_float, unsigned_long
- Date: date, date_nanos
- Other: boolean, binary, ip, geo_point, geo_shape, nested, object, flattened, join, percolator, rank_feature, rank_features, dense_vector, sparse_vector, alias

**Aggregation Types (11 supported)**
- Bucket: terms, date_histogram, histogram, range
- Metric: stats, extended_stats, cardinality, avg, sum, min, max, value_count

**Query State Features**
- Pagination (size, from, search_after)
- Sorting (multi-field, nested, mode selection)
- Highlighting (field-specific, pre/post tags, fragmenter types)
- Additional (explain, timeout, min_score, track_total_hits, _source filtering)

**Advanced Features**
- Geo queries with bounding box & distance calculations
- Nested queries with inner hits & score modes
- Fuzzy matching with configurable fuzziness
- Terms lookup across documents
- Score functions (script, random, field_value_factor, decay functions)
- Bidirectional JSON ↔ Query Builder sync (500ms debounce)
- Field schema introspection with multi-field support
- Query validation framework

---

## TIER 1: CRITICAL MISSING FEATURES (High Impact)

### 1. Script-Based Queries & Scoring

**Current Gap:** No support for Painless scripts in queries or scoring

**Why It Matters:**
- Scripts enable sophisticated custom logic (e.g., "boost results where price < competitor_price")
- Script scoring allows complex relevancy algorithms beyond simple boosting
- Critical for personalization, dynamic calculations, and advanced ranking
- 15-20% of production search applications use scripts extensively

**Recommended Features:**
- [ ] Script query builder with Painless syntax highlighting
- [ ] Script scoring UI for function_score queries
- [ ] Pre-built script library/templates (common patterns)
  - Price-based boosting
  - Custom field formulas
  - Conditional logic (if/else in scripts)
  - Date decay formulas
- [ ] Script validation and syntax checking
- [ ] Script debugging/testing (execute with sample docs)
- [ ] Script performance hints ("this script is CPU intensive")

**Example Use Cases:**
```
// E-commerce: Price competitiveness boost
if (params['competitor_price'] != null) {
  if (doc['price'].value < params['competitor_price']) {
    return _score * 1.5;
  }
}
return _score;
```

---

### 2. Advanced Aggregations (50% Coverage Gap)

**Currently Supported:** terms, date_histogram, range, stats, cardinality only

**Missing Aggregations:**

| Aggregation | Use Case | Impact |
|-------------|----------|--------|
| `percentiles` | P50/P95/P99 latencies, cost analysis | HIGH - Standard analytics |
| `percentile_ranks` | "What percentile is this value?" inverse calc | MEDIUM - Statistical analysis |
| `moving_average` | Trend analysis, anomaly detection | HIGH - Time series |
| `derivative` | Rate of change (error rate growth, sales velocity) | HIGH - Performance monitoring |
| `cumulative_sum` | Running totals, inventory tracking | MEDIUM - Analytics |
| `bucket_sort` | Limit/paginate buckets (top-10 results per bucket) | HIGH - Result limiting |
| `composite` | **Critical:** Pagination over bucket combinations | HIGH - Large datasets |
| `serial_differencing` | Time series differencing, detrending | MEDIUM - Advanced time series |
| `matrix_stats` | Correlation matrices between fields | LOW - Statistical analysis |

**Why It Matters:**
- **E-commerce:** Percentiles for order value distribution, moving averages for sales velocity trends
- **DevOps/Monitoring:** Derivatives for error rate acceleration, anomaly detection on metrics
- **Time Series:** Composite aggregations for efficient pagination (can't deep-page millions of buckets)
- **Analytics:** Statistical functions for business intelligence dashboards

**Implementation Notes:**
- Composite aggregations are the #1 request from users with large datasets
- Percentiles alone would unlock 80% of analytics use cases
- Moving averages critical for smoothing noisy data before visualization

---

### 3. Query Performance Analysis & Debugging

**Current Gap:**
- Profile API not integrated into UI
- Explain API tracked but no visualization
- No query cost estimation
- No field statistics or cardinality analysis

**Why It Matters:**
- Users can't see *why* queries are slow or which clauses cost most
- No visibility into index access patterns or scoring decisions
- Hard to optimize without understanding query execution
- Slow queries have exponential impact on user experience

**Recommended Features:**

#### 3a. Profile API Integration
- [ ] Execute query and show breakdown by:
  - Which clauses took longest (bool clauses, filters, queries)
  - Shard-level breakdown (which shards were slow)
  - Collection statistics (documents collected, queries evaluated)
  - Aggregation breakdown (bucket creation time, metric computation)
- [ ] Flamegraph or timeline view of query execution
- [ ] Recommendations: "This clause matched 10M docs but filtered to 100; consider moving to filter context"

#### 3b. Explain API Integration
- [ ] Show for top-3 results how score was calculated
- [ ] Breakdown: base score + field boost + query boost + decay function
- [ ] Highlight matching terms
- [ ] "TF-IDF: term 'widget' appears in 5% of docs, is worth 2.3 points"

#### 3c. Query Cost Estimator
- [ ] "This query will scan ~10M docs before filtering"
- [ ] "Estimated execution time: 200ms based on index stats"
- [ ] "Memory usage: ~50MB for aggregation buckets"
- [ ] Warnings: "No index on date field; query will be slow"

#### 3d. Field Statistics Sidebar
- [ ] Per-field cardinality (unique values)
- [ ] Min/max values (for numeric/date fields)
- [ ] Index coverage (% of docs that have this field)
- [ ] Analysis (what analyzer is applied)
- [ ] Suggestions: "This text field is not analyzed; switch to text type for full-text search"

#### 3e. Query Optimization Suggestions
- [ ] "You're using range on a text field; create a numeric subfield instead"
- [ ] "This geo_shape query could be 10x faster with geo_bounding_box or geo_distance"
- [ ] "Your bool query has 50 clauses; consider splitting into separate queries"
- [ ] "Move range filter to filter context for caching"

---

### 4. Query Templates & Reusability

**Current Gap:** Queries built from scratch each time; no save/load mechanism

**Why It Matters:**
- Common query patterns (e.g., "recent products in category X") repeated manually
- Team collaboration hampered without sharing templates
- No version control or comments on query logic
- Creates technical debt when same query pattern used in multiple places

**Recommended Features:**

#### 4a. Query Templates
- [ ] Save frequently-used queries with descriptions
- [ ] Template parameters/variables:
  ```
  Template: "Recent Products in Category"

  {
    "bool": {
      "must": [
        { "term": { "category": "{{category}}" } }
      ],
      "filter": [
        { "range": { "published_date": { "gte": "{{date_range}}" } } }
      ]
    }
  }
  ```
- [ ] Create from existing query with 1 click
- [ ] Use template with parameter substitution
- [ ] Template library/marketplace for sharing

#### 4b. Query History & Versioning
- [ ] Auto-save query versions (every save or on demand)
- [ ] View history with timestamps and who made changes
- [ ] Restore previous version with 1 click
- [ ] Diff view: "What changed between v1 and v2?"

#### 4c. Collaboration & Annotations
- [ ] Comments/notes on query logic ("This boost value was tuned for 2024 data")
- [ ] Track who created/modified query
- [ ] Assign ownership/reviewers
- [ ] Share queries across team with granular permissions

#### 4d. Code Generation & Export
- [ ] Export to Python (opensearchpy client)
- [ ] Export to Node.js (opensearch-js)
- [ ] Export to Java
- [ ] Export to curl command
- [ ] Generate README with parameter documentation

**Example Use Case:**
```
Template: "E-commerce Search"
Saved as: "product-search"

// Usage:
GET /products/_search
{
  "query": { ... },
  "aggs": { ... }
}
```

---

## TIER 2: IMPORTANT ENHANCEMENTS (Medium Impact)

### 5. Search Quality & Relevancy Tools

**Current Gap:** Limited visibility into ranking and relevancy decisions

#### 5a. A/B Testing Helper
- [ ] Open two queries side-by-side
- [ ] Execute both and compare results
- [ ] Show metrics:
  - Number of results per query
  - Top-10 result overlap (same docs?)
  - Average score differences
  - Field-specific relevancy (which fields contribute most)
- [ ] Statistical significance testing (is query B better?)

#### 5b. Relevancy Analyzer
- [ ] For each result, show:
  - Score breakdown (base score + boosts)
  - Which query clauses matched (named queries)
  - Field values that contributed to score
  - Explain API integration
- [ ] Field contribution analysis: "title field contributed 60% of score"

#### 5c. Query Rewrite Suggester
- [ ] "Your bool query could be simplified to a single match_phrase"
- [ ] "You have a range on a text field; use numeric subfield instead"
- [ ] "This constant_score wrapper is unnecessary; just use bool filter"
- [ ] "Your must + filter can be combined into single must clause"

#### 5d. Synonym & Analyzer Preview
- [ ] See how text is tokenized/analyzed before and after
- [ ] "Search term 'running' tokenizes to ['run'] with stemming"
- [ ] Preview synonym expansion
- [ ] Test analyzer without saving to index

#### 5e. Similar Documents Explorer
- [ ] For a given document, show which queries match it best
- [ ] Find documents similar to top result
- [ ] Use more_like_this query internally

---

### 6. Advanced Result Processing

**Current Gap:** Basic pagination; missing collapse, rescore, multi-tier ranking

#### 6a. Field Collapse (Deduplication)
- [ ] Collapse results by field (show 1 best result per product/category/author)
- [ ] Show total number of collapsed results
- [ ] Useful for:
  - Product variants (same product, different colors)
  - Multi-version documents (show latest version only)
  - Author de-duplication (one result per author)
- [ ] Inner hits: Show collapsed alternatives

**Example:**
```
"collapse": {
  "field": "product_id",
  "inner_hits": {
    "name": "variants",
    "size": 5
  }
}
```

#### 6b. Rescore Queries (Multi-Tier Ranking)
- [ ] Apply more expensive ranking to top-N results only
- [ ] First pass: Fast, simple query
- [ ] Second pass: Expensive ranking (semantic similarity, ML model) on top-100
- [ ] Dramatic performance improvement for large result sets

**Benefits:**
- Execute ML models only on top results (10-20% of candidates)
- Combine multiple ranking strategies efficiently

#### 6c. Search_after Cursor Navigation
- [ ] Visual cursor-based pagination UI
- [ ] Better than offset-based pagination for large datasets
- [ ] Show "page indicator" or "results X-Y of estimated Z"
- [ ] "Load more" pagination pattern

#### 6d. Field Transformations
- [ ] Display different field than search field
- [ ] Example: Search on "description", display "title" and "image"

---

### 7. Advanced Query Types

**Currently Supported:** 40+ types
**Missing Important Types:**

#### 7a. Percolator Queries
- [ ] Inverse search: "Which saved searches match this document?"
- [ ] Use cases:
  - Alert triggers ("notify me when product price drops below $100")
  - Content recommendation ("which saved searches match this article?")
  - Notification rules ("send notification if this condition matches")

#### 7b. More-Like-This Queries
- [ ] Find documents similar to a given document
- [ ] Customize similarity (which fields matter most?)
- [ ] Min/max term frequency thresholds
- [ ] Use cases:
  - Related products
  - Recommended articles
  - Duplicate detection

#### 7c. Span Queries
- [ ] Advanced phrase/proximity search
- [ ] Types: span_term, span_multi, span_near, span_or, span_containing, span_within
- [ ] Use cases:
  - "Find 'machine learning' within 5 words of 'algorithm'"
  - Proximity search without phrase match
  - Complex text patterns

#### 7d. Combined Fields Query
- [ ] Multi-field relevancy with single BM25 calculation
- [ ] Better than multi_match for most use cases
- [ ] Per-field boosting in single query
- [ ] More efficient than bool + must clauses

**Example:**
```
"combined_fields": {
  "query": "search term",
  "fields": ["title^3", "description^2", "tags"],
  "operator": "or"
}
```

#### 7e. Pinned Query
- [ ] Guarantee specific documents appear at top of results
- [ ] Use cases:
  - Featured/promoted results
  - Sponsored results
  - Important announcements
- [ ] Combines with any query

---

### 8. Named Queries & Query Analysis

**Current Gap:** No way to identify which clause matched a result

#### 8a. Named Queries Implementation
- [ ] Automatically add `_name` parameter to query clauses
- [ ] Show in results which named query matched each document
- [ ] Useful for debugging complex bool queries
- [ ] Show matching query portion highlighted

**Example:**
```
"bool": {
  "must": [
    { "match": { "title": "product" } },
    { "_name": "title_match" }
  ]
}
```

Results show: `"matched_queries": ["title_match"]`

---

## TIER 3: VALUABLE ADDITIONS (Lower Priority)

### 9. Index & Field Analysis

- [ ] Index health dashboard
  - Shard allocation and distribution
  - Segment count and merge activity
  - Refresh rate and indexing throughput
  - Memory usage per shard

- [ ] Field statistics
  - Cardinality (unique values)
  - Value distribution (histogram)
  - Index efficiency (indexed vs stored)
  - Field usage tracking

- [ ] Mapping analyzer test
  - See how text will be tokenized
  - Preview stemming, synonym expansion
  - Test custom analyzers

- [ ] Field correlation analyzer
  - Which fields appear together frequently
  - Co-occurrence patterns

---

### 10. Query Composition Helpers

- [ ] **Conditional Logic:** "If category=X, boost price field, else boost rating"
- [ ] **Query Suggestions:** "Based on your index, you might want to try..."
- [ ] **Bool Query Visualizer:** Tree view of complex nested bool logic
- [ ] **Operator Precedence Checker:** Ensure logic is correct
- [ ] **Complexity Metric:** "Your query has complexity score 8/10"

---

### 11. Advanced Sorting

- [ ] Script-based sorting (custom sort logic)
- [ ] Multi-level sort with different modes per field
- [ ] Geo distance sorting with visualization (on a map)
- [ ] Randomization with seed (for fairness/distribution)
- [ ] Missing value handling (nulls first/last)

---

### 12. Time Series & Analytics

- [ ] Date histogram with trend visualization
- [ ] Anomaly detection suggestions (query patterns that might indicate issues)
- [ ] Composite aggregation helper (pagination over time buckets)
- [ ] Forecasting suggestions (based on trend)
- [ ] Seasonal decomposition

---

### 13. Alerts & Monitoring (Advanced)

- [ ] Save query with alert threshold ("notify if count > 1000")
- [ ] Scheduled query execution (daily, hourly, etc.)
- [ ] Results trending over time
- [ ] Query performance monitoring and trending
- [ ] Webhook integration (POST results somewhere)

---

### 14. Integration & Export

- [ ] Export to OpenSearch Dashboards format
- [ ] Generate Kibana query syntax
- [ ] Export to OpenSearch Python client code
- [ ] Webhook/API integration for results
- [ ] Integration with Slack/Teams for alerts

---

## Implementation Priority Recommendation

### Phase 1: Foundation (Highest ROI) - 2-3 months
1. **Script Query Support** - Unlocks 80% of advanced use cases
   - Estimate: 3 weeks (UI + Painless validator)
   - Impact: High

2. **Advanced Aggregations (Phase 1)** - percentiles, moving_average, composite
   - Estimate: 3 weeks
   - Impact: Very High

3. **Profile/Explain API UI** - Essential for optimization
   - Estimate: 2 weeks
   - Impact: High (debugging capability)

4. **Query Save/Templates** - Immediate UX improvement
   - Estimate: 2 weeks
   - Impact: High (productivity)

**Phase 1 Deliverable:** Power users can optimize queries, reuse patterns, and implement advanced analytics

---

### Phase 2: Enhancement (Medium Priority) - 2-3 months
5. **Field Collapse & Rescore** - Advanced result processing
   - Estimate: 2 weeks
   - Impact: Medium-High

6. **More-like-this & Percolator** - New query types
   - Estimate: 2 weeks
   - Impact: Medium

7. **Query Versioning & History** - Collaboration features
   - Estimate: 1 week
   - Impact: Medium

8. **Relevancy Testing Tools** - Quality assurance
   - Estimate: 2 weeks
   - Impact: Medium

**Phase 2 Deliverable:** Team collaboration, advanced patterns, result optimization

---

### Phase 3: Polish (Nice to Have) - 1-2 months
9. Advanced sorting options
10. Index health dashboard
11. Code export features (Python, Node.js, curl)
12. Alerts & scheduling

---

## Feature Impact Matrix

| Feature | Effort | Impact | User Type |
|---------|--------|--------|-----------|
| Script Queries | 5/10 | 9/10 | Power Users |
| Advanced Aggregations | 6/10 | 9/10 | Analysts, DevOps |
| Profile/Explain UI | 5/10 | 8/10 | All Users |
| Query Templates | 4/10 | 8/10 | All Users |
| Field Collapse | 3/10 | 7/10 | E-commerce |
| Rescore Queries | 3/10 | 7/10 | Performance-focused |
| More-like-this | 2/10 | 6/10 | Content/Recommendation |
| Percolator | 3/10 | 6/10 | Alerts/Triggers |
| Query Versioning | 2/10 | 6/10 | Teams |
| Relevancy Tools | 6/10 | 7/10 | Search Teams |
| Index Health Dashboard | 4/10 | 5/10 | DevOps |
| Code Export | 3/10 | 5/10 | Developers |

---

## Competitive Analysis

| Feature | Crystal Forge | Kibana | Splunk | Datadog |
|---------|---------------|--------|--------|---------|
| Visual Query Builder | ✅ | ✅ | ✅ | ✅ |
| Script Support | ❌ | ✅ | ✅ | ✅ |
| Advanced Aggs | ⚠️ (50%) | ✅ | ✅ | ✅ |
| Performance Debugging | ❌ | ⚠️ | ✅ | ✅ |
| Query Templates | ❌ | ✅ | ✅ | ✅ |
| Relevancy Tools | ❌ | ⚠️ | ⚠️ | ✅ |
| Open Source | ✅ | ✅ | ❌ | ❌ |

**Opportunity:** By implementing Phase 1 features, Crystal Forge becomes competitive with enterprise solutions while remaining open-source.

---

## Success Metrics

After implementing these features, track:

1. **Adoption Metrics**
   - % of users using script queries
   - % of saved queries/templates in use
   - Average query complexity score

2. **Performance Metrics**
   - Average query execution time
   - Profile API usage (debugging adoption)
   - Query optimization suggestion acceptance rate

3. **Business Metrics**
   - User retention (power users)
   - Feature requests related to these gaps (should drop)
   - Time to build complex query (before/after)

---

## Implementation Notes

### Technical Considerations

1. **Script Validation:** Need Painless parser or integration with OpenSearch validation API
2. **Aggregation UI:** Pattern-based builder similar to query builder
3. **Profile/Explain:** Async operation; need loading/results modal
4. **Templates:** Need new database/storage layer (currently stateless)
5. **Performance Analysis:** May need backend optimizations for large result sets

### Dependencies

- Frontend: New UI components for each feature
- Backend: Template storage, possibly caching for performance analysis
- Client Library: Enhanced opensearch-client wrapper methods
- Testing: Comprehensive test coverage for complex features

### Risk Areas

- Script syntax errors (need good error messaging)
- Performance of large aggregations (might need backend pagination)
- Template versioning conflicts (concurrent edits)
- Explain API response size (might be very large)

---

## Next Steps

1. **Validate with Users:** Poll users for feature priorities (Phase 1 vs Phase 2)
2. **Prototype:** Build mockups for top-3 features (Script UI, Aggregations, Profile)
3. **Estimate:** Detailed effort estimation for Phase 1
4. **Plan Sprint:** Allocate resources and create implementation tasks

---

## Related Documents

- [CLAUDE.md](./CLAUDE.md) - Project overview and architecture
- [Package Documentation](./packages/) - Technical details of each package
- [Recent Commits](./commits) - Implementation history

---

## Questions & Discussion

This document is a living roadmap. Questions to discuss with team:

1. Which Tier 1 feature should be priority #1? (Script queries seem most impactful)
2. Should we build templates as local-only or shareable?
3. For performance analysis, start with Profile API or Explain API first?
4. Are there user categories we haven't considered that need specific features?
5. Should advanced features be in separate "Pro" UI or integrated?

---

**Document Version:** 1.0
**Created:** 2026-01-01
**Next Review:** 2026-03-01
