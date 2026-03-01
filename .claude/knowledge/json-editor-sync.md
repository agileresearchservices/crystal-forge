# JSON Editor Bidirectional Sync

## Purpose
Reference for Monaco editor setup, bidirectional sync flow, and Dev Tools format handling.

## Key Files
| File | Purpose |
|---|---|
| `apps/web/components/JSONPreview.tsx` | Main bidirectional sync implementation |
| `apps/web/lib/opensearch-schema.ts` | JSON schema for OpenSearch DSL |
| `apps/web/lib/monaco-completions.ts` | Context-aware completions and hover providers |
| `packages/query-dsl/src/deserializer.ts` | `deserializeQueryState()` function |

## Bidirectional Sync Flow

### Visual Builder → JSON (Automatic)
1. User modifies query in QueryBuilder (drag field, change operator, etc.)
2. QueryContext reducer updates state.query
3. JSONPreview component calls `serializeQueryState(state)` → JSON string
4. Monaco editor content updates automatically
5. **No debounce needed** — serialization is instant

### JSON → Visual Builder (Debounced)
1. User edits JSON in Monaco editor
2. `onChange` handler triggered
3. `isEditing` flag set to `true` (prevents loop)
4. 300ms debounce timer started
5. Debounced function:
   - Extract JSON using regex (strip Dev Tools format)
   - `JSON.parse()` — if fails, show error
   - `deserializeQueryState()` — convert to QueryState
   - Call `setQuery()` and `setPagination()`
   - Set `isEditing = false`
6. If error: show red ring + error message, do NOT update query

## Key Variables and Functions

### isEditing Flag
```typescript
const [isEditing, setIsEditing] = useState(false);
```

**Purpose:** Prevent infinite loop when JSON updates from builder

**Flow:**
1. User edits JSON → `isEditing = true`
2. Debounce finishes → attempt parse
3. If success: `serializeQueryState()` updates JSON; BUT isEditing still true → skip re-parse
4. After state updates → `isEditing = false`
5. Next visual builder change → isEditing false, so update JSON

## Dev Tools Format Handling

### OpenSearch Dev Tools Format
```
GET opensearch-demo/_search
{
  "query": { ... },
  "aggs": { ... }
}
```

### Extraction Regex
```typescript
const devToolsRegex = /^(GET|POST|PUT|DELETE|HEAD)\s+[^\n]*\n/;
const jsonStr = text.replace(devToolsRegex, '').trim();
```

**Test Cases:**
```
// Input
GET /my-index/_search
{ "query": { "match_all": {} } }

// After regex replace
{ "query": { "match_all": {} } }
```

### formatDevTools() Function
```typescript
function formatDevTools(json: string, index: string): string {
  return `GET /${index}/_search\n${json}`;
}
```

**Used for:** Copy-to-clipboard feature (includes full Dev Tools format)

## Monaco Editor Setup

### Schema Registration
```typescript
const schema = {
  uri: "http://opensearch-query.schema.json",
  schema: opensearchQuerySchema
};

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  schemaValidation: 'error',
  schemas: [schema]
});
```

### Completion Provider
```typescript
monaco.languages.registerCompletionItemProvider('json', {
  provideCompletionItems(model, position) {
    const lineText = model.getLineContent(position.lineNumber);
    // Context-aware: detect if we're in 'query', 'aggs', or nested clause
    // Return completions based on context
  }
});
```

**Contexts Detected:**
- Root level: `query`, `aggs`, `size`, `from`, `sort`, `_source`
- Inside `query`: All 26 query types
- Inside `aggs`: All 12 aggregation types
- Inside `bool`: `must`, `should`, `must_not`, `filter`, `minimum_should_match`

### Hover Provider
```typescript
monaco.languages.registerHoverProvider('json', {
  provideHover(model, position) {
    // Return tooltip with query type description
    // E.g., hovering "match": "Full-text search with analysis"
  }
});
```

## Error Handling

### JSON Parse Error
```typescript
if (jsonParseError) {
  return (
    <>
      <Editor ... />
      <div className="ring-2 ring-red-500">
        <AlertCircle className="text-red-500" />
        <span>Invalid JSON: {jsonParseError.message}</span>
      </div>
    </>
  );
}
```

### Deserialization Error
```typescript
const deserialized = deserializeQueryState(parsed);
if (deserialized.errors && deserialized.errors.length > 0) {
  // Show error but don't update query
  console.error('Deserialization failed:', deserialized.errors);
}
```

## SimpleJSONPreview Fallback

For mobile or low-resource environments:

```typescript
function SimpleJSONPreview({ query }: { query: QueryNode }) {
  return (
    <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
      {JSON.stringify(serializeQuery(query), null, 2)}
    </pre>
  );
}
```

**Limitations:**
- Read-only (no editing)
- No completions or validation
- No syntax highlighting (plain monospace)

## Debounce Implementation

```typescript
const debouncedParse = useCallback(
  debounce((text: string) => {
    // Parse and update query
  }, 300),
  [setQuery, setPagination]
);

const handleEditorChange = (value: string) => {
  setEditorValue(value);
  setIsEditing(true);
  debouncedParse(value);
};
```

**Why 300ms:**
- Fast enough for user feedback (no lag)
- Slow enough to avoid excessive parsing during rapid typing
- Standard in search UIs (Google, Elasticsearch)

## Schema Structure

The `opensearchQuerySchema` (in `lib/opensearch-schema.ts`) defines:

### Root Properties
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "object" },
    "aggs": { "type": "object" },
    "size": { "type": "integer" },
    "from": { "type": "integer" },
    "sort": { "type": "array" },
    "_source": { "type": ["array", "boolean"] }
  }
}
```

### Query Types (oneOf)
```json
{
  "query": {
    "oneOf": [
      { "properties": { "match": { "type": "object" } } },
      { "properties": { "term": { "type": "object" } } },
      { "properties": { "bool": { "type": "object" } } },
      // ... 23 more query types
    ]
  }
}
```

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Infinite loop between visual builder and JSON | `isEditing` flag not properly managed | Check flag logic; ensure it's set to false after successful update |
| Dev Tools format not stripped | Regex doesn't match input format | Test regex with actual Dev Tools output; may need to handle variations |
| Completions don't appear | Provider registered but conditions not met | Check context detection; verify model is JSON language |
| Schema validation shows false positives | Schema too strict or doesn't match OpenSearch spec | Review schema against official OpenSearch docs; relax validation if needed |
| Debounce causes lag | 300ms too long for user | Reduce to 200ms; monitor performance |
| Editor doesn't update from visual builder | `readOnly: true` or state not updating | Verify serialization runs on every query change; check editor ref |

## Do / Don't

| Do | Don't |
|---|---|
| Use debounce for JSON → visual updates | Parse on every keystroke (performance) |
| Set `isEditing` before debounced parse | Update query immediately on JSON change (infinite loop) |
| Strip Dev Tools format before parsing | Pass Dev Tools format directly to JSON.parse (fails) |
| Register schema on Monaco mount, not render | Re-register providers on every render |
| Use `deserializeQueryState()` to parse JSON | Manually transform JSON structure |
| Show error UI for parse/deserialization failures | Silently fail and ignore invalid JSON |
| Test with malformed JSON and Dev Tools format | Test only with valid, plain JSON |
| Use SimpleJSONPreview fallback on mobile | Force Monaco editor on all devices |
