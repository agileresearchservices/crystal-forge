# Query DSL Types

## Purpose
Reference for all 26 implemented OpenSearch query types with serialization formats and edge cases.

## Key Files
| File | Purpose |
|---|---|
| `packages/query-dsl/src/types.ts` | Type definitions for all query nodes |
| `packages/query-dsl/src/serializer.ts` | Conversion to OpenSearch JSON |
| `packages/query-dsl/src/deserializer.ts` | Conversion from OpenSearch JSON |
| `packages/query-dsl/src/operators.ts` | Operator definitions and FIELD_TYPE_OPERATORS |

## Full-Text Query Types

### MatchQueryNode
**TypeScript Interface:**
```typescript
interface MatchQueryNode extends QueryNode {
  type: 'match';
  field: string;
  value: string;
  options?: {
    operator?: 'AND' | 'OR';
    minimumShouldMatch?: number;
    boost?: number;
    fuzziness?: string;
    prefixLength?: number;
    maxExpansions?: number;
    // ... 7 more option fields
  };
}
```

**Serialization Format:**
- **Shorthand** (no options): `{ match: { fieldName: "value" } }`
- **Verbose** (with options): `{ match: { fieldName: { query: "value", operator: "AND", boost: 2.0, ... } } }`

**Gotchas:**
- Empty `options` object → serialize as shorthand (omit options)
- `operator: 'AND'` → serializes as `"AND"` string, not boolean
- Fuzziness values: `"0"`, `"1"`, `"2"`, `"AUTO"` — validated in serializer

### MatchPhraseQueryNode
**Serialization Format:** `{ match_phrase: { fieldName: "exact phrase" } }`
**Gotchas:** No `operator` option; exact phrase matching only

### MatchPhrasePrefixQueryNode
**Serialization Format:** `{ match_phrase_prefix: { fieldName: "prefix match" } }`
**Gotchas:** Optional `max_expansions` parameter controls prefix expansion

### MultiMatchQueryNode
**TypeScript Interface:**
```typescript
interface MultiMatchQueryNode extends QueryNode {
  type: 'multi_match';
  fields: string[];
  value: string;
  queryType?: 'best_fields' | 'most_fields' | 'cross_fields' | 'phrase' | 'phrase_prefix';
  operator?: 'AND' | 'OR';
  minimumShouldMatch?: number;
}
```

**Serialization Format:** `{ multi_match: { query: "value", fields: ["f1", "f2"], type: "best_fields", ... } }`
**Gotchas:** `fields` array must not be empty; default type is `"best_fields"`

### QueryStringQueryNode
**Serialization Format:** `{ query_string: { query: "field:value AND other:value" } }`
**Gotchas:** User must write Lucene syntax manually; no option validation

### SimpleQueryStringQueryNode
**Serialization Format:** `{ simple_query_string: { query: "value", fields: ["f1", "f2"] } }`
**Gotchas:** Cannot use Lucene operators; simpler for user input

## Term-Level Query Types

### TermQueryNode
**Serialization Format:** `{ term: { fieldName: { value: "exact" } } }`
**Gotchas:**
- Keyword/boolean fields only (no analysis)
- Value is exact match, case-sensitive

### TermsQueryNode
**Dual Format:**
- **Values Array:** `{ terms: { fieldName: ["val1", "val2"] } }`
- **Lookup Object:** `{ terms: { fieldName: { index: "...", id: "...", path: "..." } } }`

**TypeScript Interface:**
```typescript
interface TermsQueryNode extends QueryNode {
  type: 'terms';
  field: string;
  values?: any[];
  lookup?: { index: string; id: string; path: string };
}
```

**Gotchas:** Serializer checks `values.length > 0` OR `lookup` — cannot have both undefined

### RangeQueryNode
**Serialization Format:**
```json
{ "range": { "fieldName": { "gte": "10", "lte": "100" } } }
```

**Gotcha:** `console.warn()` emitted if node has **no bounds** (no gt/gte/lt/lte). This is intentional — empty range is likely user error.

### PrefixQueryNode
**Serialization Format:** `{ prefix: { fieldName: "prefix" } }`

### WildcardQueryNode
**Serialization Format:** `{ wildcard: { fieldName: "wil*card" } }`
**Gotchas:** `*` matches any char, `?` matches single char; no escaping in Crystal Forge

### RegexpQueryNode
**Serialization Format:** `{ regexp: { fieldName: "^regex$" } }`
**Gotchas:** Java regex syntax (not JavaScript); special chars must be escaped

### FuzzyQueryNode
**Serialization Format:** `{ fuzzy: { fieldName: { value: "val", fuzziness: "AUTO" } } }`

### ExistsQueryNode
**Serialization Format:** `{ exists: { field: "fieldName" } }`
**Gotchas:** Simple — no options

### IdsQueryNode
**Serialization Format:** `{ ids: { values: ["id1", "id2"] } }`

## Compound Query Types

### BoolQueryNode
**TypeScript Interface:**
```typescript
interface BoolQueryNode extends QueryNode {
  type: 'bool';
  must?: QueryNode[];
  should?: QueryNode[];
  must_not?: QueryNode[];
  filter?: QueryNode[];
  minimumShouldMatch?: number;
  boost?: number;
}
```

**Serialization Format:**
```json
{
  "bool": {
    "must": [...],
    "should": [...],
    "must_not": [...],
    "filter": [...],
    "minimum_should_match": 2
  }
}
```

**Critical Gotcha:**
- **Empty `bool`** (all clauses empty) → serializes to `{ match_all: {} }` (not `{ bool: {} }`)
- Only non-empty clauses are included in output
- If root query is not bool and user adds to a clause, it's auto-wrapped: `{ match: {...} }` → `{ bool: { must: [{ match: {...} }] } }`

### DisMaxQueryNode
**Serialization Format:**
```json
{
  "dis_max": {
    "queries": [...],
    "tie_breaker": 0.3
  }
}
```

### ConstantScoreQueryNode
**Serialization Format:**
```json
{
  "constant_score": {
    "filter": {...},
    "boost": 1.2
  }
}
```

### BoostingQueryNode
**Serialization Format:**
```json
{
  "boosting": {
    "positive": {...},
    "negative": {...},
    "negative_boost": 0.5
  }
}
```

### FunctionScoreQueryNode
**Complex Recursive Serialization:**
```json
{
  "function_score": {
    "query": {...},
    "functions": [
      { "filter": {...}, "weight": 2.0 },
      { "filter": {...}, "random_score": { "seed": 42 } }
    ],
    "boost_mode": "multiply",
    "score_mode": "sum"
  }
}
```

**Gotchas:**
- Recursive query inside + array of function objects
- `boost_mode`: `"multiply" | "replace" | "sum" | "avg" | "max" | "min"`
- `score_mode`: `"multiply" | "sum" | "avg" | "first" | "max" | "min"`

## Joining Query Types

### NestedQueryNode
**Serialization Format:**
```json
{
  "nested": {
    "path": "nested_field",
    "query": {...},
    "score_mode": "avg",
    "inner_hits": { "size": 5 }
  }
}
```

**Gotchas:**
- `path` must match exact nested field name from mapping
- `score_mode`: `"avg" | "sum" | "min" | "max" | "none"`
- `inner_hits` is optional but useful for showing matched nested docs

## Geo Query Types

### GeoDistanceQueryNode
**Serialization Format:**
```json
{
  "geo_distance": {
    "distance": "100km",
    "location": { "lat": 40.0, "lon": -70.0 }
  }
}
```

**Gotchas:**
- `distance` is a **string** with unit: `"100km"`, `"50mi"`, `"1000m"`
- Accepts `"lat", "lon"` or `"lon", "lat"` (coordinates are flexible)

### GeoBoundingBoxQueryNode
**Serialization Format:**
```json
{
  "geo_bounding_box": {
    "location": {
      "top_left": { "lat": 40.0, "lon": -70.0 },
      "bottom_right": { "lat": 39.0, "lon": -69.0 }
    }
  }
}
```

### GeoShapeQueryNode
**Serialization Format:**
```json
{
  "geo_shape": {
    "location": {
      "shape": { "type": "polygon", "coordinates": [...] },
      "relation": "within"
    }
  }
}
```

## Special Query Types

### MatchAllQueryNode
**Serialization Format:** `{ match_all: {} }`
**Gotchas:** Returns all documents

### MatchNoneQueryNode
**Serialization Format:** `{ match_none: {} }`
**Gotchas:** Returns no documents; useful for boolean NOT ALL

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Empty `{ bool: {} }` appears in JSON | User created bool with no clauses | Serializer auto-converts to `match_all` — check if this is intentional |
| `terms` query with both `values` and `lookup` | Code creates both fields | Validate in deserializer: either-or, not both |
| Range query with no bounds emits warn | User forgot to set gt/gte/lt/lte | Show validation error in UI; do not serialize empty range |
| Nested query path doesn't match | Field name mismatch from mapping | Show field autocomplete in UI when selecting nested path |
| Function score has invalid `boost_mode` | Typo in mode value | Enum validate before serializing |

## Do / Don't

| Do | Don't |
|---|---|
| Call `serializeQuery(node)` to convert to JSON | Manually construct JSON — use serializer |
| Use `deserializeQuery(json)` to read OpenSearch JSON | Try to parse JSON into types manually |
| Validate serialized JSON against OpenSearch schema | Trust serializer output without testing |
| Add new query type in 4 files: types.ts, serializer.ts, deserializer.ts, operators.ts | Forget to update all 4 files |
| Test with roundtrip: `serialize → deserialize → assertEqual` | Add type without roundtrip test |
| Use `FIELD_TYPE_OPERATORS` to map field → valid operators | Hardcode operator lists per field type |
| Emit `console.warn()` for user errors (empty range, invalid enum) | Silently fail on edge cases |
| Check `values.length > 0` before serializing `terms` | Allow empty terms array |
