# Field Type to Operator Mappings

## Purpose
Reference for all field types, their supported operators, and default query node creation.

## Key Files
| File | Purpose |
|---|---|
| `packages/query-dsl/src/operators.ts` | FIELD_TYPE_OPERATORS constant, OperatorDefinition type |
| `apps/web/utils/createQueryNodeFromField.ts` | Smart default query node creation by field type |
| `apps/web/components/OperatorSelector.tsx` | UI dropdown for selecting operator |

## OperatorDefinition Type

```typescript
interface OperatorDefinition {
  label: string;           // Display label: "Exact Match"
  queryType: QueryType;    // Type value: "term", "match", "range"
  description?: string;    // Tooltip: "Keyword-exact matching, case-sensitive"
  recommended?: boolean;   // Show as recommended/default
}
```

## FIELD_TYPE_OPERATORS Mapping

Complete mapping of all 32 field types to supported operators:

### Text Field
```typescript
text: [
  { label: "Full-Text Match", queryType: "match", recommended: true },
  { label: "Phrase Match", queryType: "match_phrase" },
  { label: "Phrase Prefix", queryType: "match_phrase_prefix" },
  { label: "Multi-Match", queryType: "multi_match" },
  { label: "Query String", queryType: "query_string" },
  { label: "Simple Query String", queryType: "simple_query_string" },
  { label: "Wildcard", queryType: "wildcard" },
  { label: "Regexp", queryType: "regexp" },
  { label: "Fuzzy", queryType: "fuzzy" },
  { label: "Exists", queryType: "exists" }
]
```

### Keyword Field
```typescript
keyword: [
  { label: "Exact Match", queryType: "term", recommended: true },
  { label: "Multiple Values", queryType: "terms" },
  { label: "Prefix", queryType: "prefix" },
  { label: "Wildcard", queryType: "wildcard" },
  { label: "Regexp", queryType: "regexp" },
  { label: "Exists", queryType: "exists" }
]
```

### Integer, Long, Short, Byte Fields
```typescript
integer: [
  { label: "Range", queryType: "range", recommended: true },
  { label: "Exact Match", queryType: "term" },
  { label: "Multiple Values", queryType: "terms" },
  { label: "Exists", queryType: "exists" }
]
```

### Float, Double, Scaled Float Fields
```typescript
float: [
  { label: "Range", queryType: "range", recommended: true },
  { label: "Exact Match", queryType: "term" },
  { label: "Exists", queryType: "exists" }
]
```

### Date Field
```typescript
date: [
  { label: "Range", queryType: "range", recommended: true },
  { label: "Exact Match", queryType: "term" },
  { label: "Exists", queryType: "exists" }
]
```

### Boolean Field
```typescript
boolean: [
  { label: "Exact Match", queryType: "term", recommended: true },
  { label: "Exists", queryType: "exists" }
]
```

### Nested Field
```typescript
nested: [
  { label: "Nested Query", queryType: "nested", recommended: true }
]
```

### Geo-Point Field
```typescript
geo_point: [
  { label: "Geo Distance", queryType: "geo_distance", recommended: true },
  { label: "Geo Bounding Box", queryType: "geo_bounding_box" }
]
```

### Geo-Shape Field
```typescript
geo_shape: [
  { label: "Geo Shape", queryType: "geo_shape", recommended: true }
]
```

### IP Field
```typescript
ip: [
  { label: "CIDR Range", queryType: "term", recommended: true },
  { label: "Range", queryType: "range" },
  { label: "Exists", queryType: "exists" }
]
```

### Wildcard Field
```typescript
wildcard: [
  { label: "Wildcard Match", queryType: "wildcard", recommended: true },
  { label: "Exists", queryType: "exists" }
]
```

### Object Field
```typescript
object: [
  { label: "Nested Query", queryType: "nested", recommended: true },
  { label: "Exists", queryType: "exists" }
]
```

### Binary Field
```typescript
binary: [
  { label: "Exists", queryType: "exists", recommended: true }
]
```

### Murmur3 Field
```typescript
murmur3: [
  { label: "Exact Match", queryType: "term", recommended: true }
]
```

### Additional Fields (Mapped Same as Primary Types)
- `text_strict` → same as `text`
- `match_only_text` → same as `text`
- `unsigned_long` → same as `integer`
- `half_float` → same as `float`
- `rank_feature` → `term`, `range`, `exists`
- `rank_features` → `exists`, `match_all`
- `token_count` → same as `integer`

## Default Query Node Creation

The `createQueryNodeFromField(field: FieldInfo): QueryNode` function maps field types to recommended node types:

| Field Type | Default Query Type | Default Query Node |
|---|---|---|
| `text` | `match` | `{ type: 'match', field: 'fieldName', value: '' }` |
| `keyword` | `term` | `{ type: 'term', field: 'fieldName', values: [] }` |
| `integer` / numeric | `range` | `{ type: 'range', field: 'fieldName', gte: '', lte: '' }` |
| `date` | `range` | `{ type: 'range', field: 'fieldName', gte: '', lte: '' }` |
| `boolean` | `term` | `{ type: 'term', field: 'fieldName', values: [true] }` |
| `nested` | `nested` | `{ type: 'nested', path: 'fieldName', query: { match_all: {} } }` |
| `geo_point` | `geo_distance` | `{ type: 'geo_distance', field: 'fieldName', distance: '100km', lat: 0, lon: 0 }` |

**Fallback:** If field type not recognized, default to `match` query.

## Field Type Mismatch Warnings

The `getFieldTypeMismatchWarning(fieldType: string, queryType: QueryType): string | null` function detects mismatches:

| Mismatch Case | Severity | Message |
|---|---|---|
| `term` query on `text` field | Amber | "Term queries skip analysis. Use Match for better results." |
| `match` query on `keyword` field | Amber | "Match queries run analysis. Use Term for exact matching." |
| `range` query on `keyword` field | Yellow | "Range queries on keywords may not work as expected." |
| `geo_distance` on non-geo field | Red | "Geographic query on non-geographic field." |
| `nested` on non-nested field | Red | "Nested query requires nested field type." |

## Getting Operators for a Field

```typescript
import { getOperatorsForFieldType } from '@crystal-forge/query-dsl';

const textOperators = getOperatorsForFieldType('text');
// Returns: [ MatchOp, MatchPhraseOp, ..., ExistsOp ]

const recommended = textOperators.find(op => op.recommended);
// Returns: MatchOp ({ label: "Full-Text Match", queryType: "match" })
```

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| OperatorSelector shows wrong operators | Field type not mapped in FIELD_TYPE_OPERATORS | Add field type to mapping; verify field type matches OpenSearch mapping |
| Default query created with wrong type | `createQueryNodeFromField` doesn't recognize field type | Check fallback case; add field type to mapping |
| Mismatch warning doesn't appear | `getFieldTypeMismatchWarning` returns null | Warning is optional; UI may choose not to show |
| Term query on text field allowed | No mismatch validation on submit | Validation is UI suggestion only; OpenSearch will fail at execute time |
| Geo query on non-geo field allowed | Type checking disabled | Add runtime validation in QueryNode component |

## Do / Don't

| Do | Don't |
|---|---|
| Use `getOperatorsForFieldType()` to populate OperatorSelector | Hardcode operator lists in components |
| Call `createQueryNodeFromField()` when user adds field | Create query nodes manually without using helper |
| Show mismatch warnings in UI as amber/yellow/red | Silently allow type mismatches |
| Use `recommended: true` to highlight default operator | Alphabetize operators; ignore recommendations |
| Test operator selection with all 32 field types | Test with only common types (text, keyword, numeric) |
| Validate field type against mapping before operations | Assume all field types exist in FIELD_TYPE_OPERATORS |
