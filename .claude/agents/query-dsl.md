# Query DSL Agent

---
**name:** query-dsl
**description:** Handle tasks involving query types, serialization, deserialization, and operators. Use when adding/fixing query types, serialization logic, operator mappings, or aggregation definitions.

---

## Domain Knowledge

Crystal Forge implements 26 OpenSearch query types with full serialization/deserialization support. Every query type must be handled in 4 files: `types.ts`, `serializer.ts`, `deserializer.ts`, and `operators.ts`.

### Query Type Structure
- **26 Implemented Types:** match, match_phrase, match_phrase_prefix, multi_match, query_string, simple_query_string, term, terms, range, prefix, wildcard, regexp, fuzzy, exists, ids, bool, dis_max, constant_score, boosting, function_score, nested, geo_distance, geo_bounding_box, geo_shape, match_all, match_none
- **Smart Serialization:** Shorthand format for simple cases (e.g., `match: { field: value }`), verbose for complex cases with options
- **Key Edge Cases:** Empty `bool` → `match_all`, `terms` has dual format (values array OR lookup object), `range` emits warn if no bounds, `function_score` is nested recursive

### Operator System
- **FIELD_TYPE_OPERATORS:** Maps 32 field types to valid operators (TermDefinition[] per field)
- **OperatorDefinition:** Has `label`, `queryType`, optional `description`, and `recommended` flag
- **32 Field Types:** text, keyword, integer, float, date, boolean, nested, geo_point, geo_shape, ip, wildcard, object, binary, murmur3, and variants (text_strict, match_only_text, etc.)
- **Smart Defaults:** text→match, keyword→term, numeric→range, date→range, boolean→term(true), nested→nested, geo_point→geo_distance

### Aggregation Types (12 Total)
- **Implemented:** terms, stats, extended_stats, date_histogram, histogram, range, cardinality, avg, sum, min, max, value_count
- **Serialization:** Each agg has unique parameter names (e.g., `calendar_interval` for date_histogram, `size` for terms)
- **Chart Types:** Bar/area charts for bucketing aggs, StatCard grid for metric aggs
- **API Endpoint:** `/api/opensearch/aggregate` with smart type selection by field type

### Known Failure Modes
- **Empty bool persistence:** Deserializer must convert empty `{ bool: {} }` to `{ match_all: {} }` during round-trip
- **Terms serialization:** Both `values[]` and `lookup` formats must be supported; serializer validates either-or
- **Range without bounds:** Intentional warn() for user error detection
- **Function score recursion:** Nested `query` + `functions[]` requires careful deserialization
- **Operator mismatch:** `term` on text field, `match` on keyword field → should warn in UI

## Common Tasks

### Adding a New Query Type
1. **types.ts:** Define interface extending `QueryNode` with `type: 'queryTypeName'` and all parameters
2. **serializer.ts:** Add case in `serializeQuery()` to output correct JSON format (shorthand vs verbose)
3. **deserializer.ts:** Add case in `deserializeQuery()` to parse JSON back to QueryNode
4. **operators.ts:** Add entry to `FIELD_TYPE_OPERATORS` or `COMPATIBLE_QUERY_TYPES` for relevant field types
5. **Test:** Create roundtrip test: `serialize(node) → JSON → deserialize(JSON) → assertEqual(original)`

### Adding a New Field Type
1. **operators.ts:** Add field type entry to `FIELD_TYPE_OPERATORS` mapping to operator array
2. **createQueryNodeFromField.ts:** Add case to switch statement for default query node type
3. **Test:** Verify field type appears in FieldList and creates correct node when added
4. **Validation:** Add case to `getFieldTypeMismatchWarning()` if new type has operator conflicts

### Fixing Serialization Bug
1. **Read:** Check failing test or issue description
2. **Trace:** Start in serializer.ts → find the query type → trace through `JSON.stringify()` output
3. **Inspect:** Compare actual output to OpenSearch spec
4. **Fix:** Adjust parameter names (snake_case in JSON, camelCase in types), handle edge cases (empty arrays, null values)
5. **Test:** Add specific test case for the bug; verify roundtrip

### Adding Aggregation Support
1. **types.ts:** Define aggregation interface with all parameters
2. **serializer.ts:** Add `serializeAggregation()` case to output correct JSON
3. **API route:** Update `/api/opensearch/aggregate` smart selection logic if needed
4. **UI Component:** Add form fields for aggregation parameters in `AggregationParameterForm.tsx`
5. **Chart Rendering:** Add case to render aggregation type in `ResultsPanel.tsx` (BarChart, AreaChart, or StatCard grid)

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Roundtrip test fails (A ≠ deserialize(serialize(A))) | Edge case not handled in serializer or deserializer | Add explicit handling for edge case (empty arrays, null fields, format variations) |
| Operator list missing for field type | `FIELD_TYPE_OPERATORS` incomplete or field type not recognized | Check field type name matches exactly (case-sensitive); add to mapping |
| Aggregation returns empty buckets | Agg serialization wrong or `min_doc_count` too high | Verify agg JSON matches spec; lower minDocCount to 0 for missing intervals |
| Query executes but returns wrong results | Serialization produced wrong query structure | Log serialized JSON and compare to OpenSearch spec; check parameter names (snake_case) |
| Terms query with both values and lookup | Both fields populated in deserialization | Add validation: deserializer should accept only one, throw error if both |

## Do / Don't

| Do | Don't |
|---|---|
| Update all 4 files (types, serializer, deserializer, operators) when adding query type | Add type to only one file |
| Test roundtrip: serialize → deserialize → assertEqual | Test only one direction |
| Use snake_case for JSON output (OpenSearch standard) | Use camelCase in JSON output |
| Handle empty/null values explicitly in serializer | Assume all fields populated |
| Validate operator type before creating node in UI | Trust user input without checking field type |
| Check query executes before declaring fix complete | Assume JSON output is correct without testing |
| Use descriptive `console.warn()` for intentional edge cases | Silently skip edge cases |

## Key Files
- `packages/query-dsl/src/types.ts` - Type definitions
- `packages/query-dsl/src/serializer.ts` - Convert to OpenSearch JSON
- `packages/query-dsl/src/deserializer.ts` - Parse from OpenSearch JSON
- `packages/query-dsl/src/operators.ts` - Operator mappings

## Knowledge Base References
- `.claude/knowledge/query-dsl-types.md` - All 26 query types with examples
- `.claude/knowledge/field-type-operators.md` - Field type to operator mappings
- `.claude/knowledge/aggregations.md` - Aggregation types and serialization
