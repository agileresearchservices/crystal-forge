# Storage & IndexedDB Agent

---
**name:** storage-indexeddb
**description:** Handle tasks involving IndexedDB storage, template management, query history, aggregation templates, and browser-local persistence. Use when modifying storage schemas, CRUD operations, seed data, or fixing data persistence issues.

---

## Domain Knowledge

Crystal Forge uses IndexedDB (browser-local persistent storage) with 3 object stores: `query-templates`, `query-history`, and `aggregation-templates`. All operations use async/await; storage is initialized on app startup.

### Database Setup
**DB Name:** `crystal-forge-db`
**Version:** 1
**Object Stores:** 3 total

**Initialization:**
```typescript
import { initDB, getDB, ensureDB } from '@crystal-forge/storage';

// On app init
useEffect(() => {
  initDB().then(db => {
    seedTemplates(); // Idempotent; safe to call multiple times
  });
}, []);
```

### Object Store 1: query-templates
**KeyPath:** `id` (UUID v4)

**Indexes:**
- `category` (non-unique) - For filtering by category
- `created_at` (non-unique) - For sorting by date
- `name` (non-unique) - For search

**Data Type:**
```typescript
interface QueryTemplate {
  id: string;                    // UUID v4
  name: string;                  // Display name
  description?: string;
  category: 'common' | 'ecommerce' | 'advanced' | 'custom';
  tags?: string[];
  query: QueryState;             // Serialized { query, pagination }
  aggs?: Aggregation[];
  isBuiltIn: boolean;            // true = immutable, can't delete
  created_at: string;            // ISO timestamp
  updated_at: string;
}
```

**Built-in Templates:** 18 total (across 3 categories); marked `isBuiltIn: true`

### Object Store 2: query-history
**KeyPath:** `id` (UUID v4)

**Indexes:**
- `timestamp` (non-unique) - For sorting by date
- `index_name` (non-unique) - For filtering by index

**Data Type:**
```typescript
interface QueryHistoryEntry {
  id: string;
  query: QueryNode;              // Executed query
  index_name: string;
  result_count: number;
  timestamp: string;             // ISO timestamp
  took_ms?: number;              // Query execution time
  error?: string;                // Error if query failed
}
```

**Max Entries:** 50 (auto-pruned in `addToHistory()`)

### Object Store 3: aggregation-templates
**KeyPath:** `id` (UUID v4)

**Indexes:**
- `category` (non-unique)
- `agg_type` (non-unique)

**Data Type:**
```typescript
interface AggregationTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'common' | 'ecommerce' | 'advanced' | 'custom';
  agg_type: string;              // 'terms', 'stats', 'date_histogram', etc.
  aggregation: Aggregation;      // Full agg definition
  field_types: string[];         // Compatible field types
  isBuiltIn: boolean;
  created_at: string;
  updated_at: string;
}
```

### CRUD Operations

#### Templates - Read
```typescript
// Get all templates (built-in + custom)
const all = await getAllTemplates();

// Get templates by category
const common = await getTemplatesByCategory('common');

// Search (in-memory over loaded templates)
const results = await searchTemplates('product');

// Get single template by ID
const template = await db
  .transaction('query-templates', 'readonly')
  .objectStore('query-templates')
  .get(templateId);
```

#### Templates - Create/Update
```typescript
// Save new template (auto-generates id, timestamps)
const saved = await saveTemplate('My Query', queryState, {
  category: 'custom',
  tags: ['product', 'search'],
  description: 'Find products by name'
});

// Update existing template (preserves id, created_at; updates updated_at)
const updated = await updateTemplate(templateId, {
  name: 'New Name',
  description: 'Updated description'
});
```

#### Templates - Delete
```typescript
// Delete custom template
await deleteTemplate(customTemplateId);

// Trying to delete built-in template throws error
try {
  await deleteTemplate(builtInId); // Throws: "Cannot delete built-in template"
} catch (error) {
  console.error(error.message);
}
```

#### History - Write
```typescript
// Add query to history (auto-prunes to 50 entries)
await addToHistory(queryNode, 'opensearch-demo', 1234, {
  took_ms: 15,
  error: undefined
});

// History auto-prunes:
// If count > 50, deletes oldest entries until count = 50
```

#### History - Read
```typescript
// Get all history
const all = await getAllHistory();

// Get for specific index
const indexHistory = await getHistoryForIndex('opensearch-demo');

// Get recent N entries
const recent = await getRecentHistory(10);
```

#### History - Delete
```typescript
// Clear all history
await clearHistory();
```

#### Aggregation Templates
```typescript
// Get all agg templates
const all = await getAllAggregationTemplates();

// Get by category
const common = await getAggregationTemplatesByCategory('common');

// Save custom agg template
const saved = await saveAggregationTemplate('Product Count', {
  type: 'terms',
  field: 'product_name',
  size: 20
}, { category: 'custom' });

// Delete (throws if built-in)
await deleteAggregationTemplate(customId);
```

### Seed Data

**Function:** `seedTemplates(): Promise<void>`

**Behavior:**
1. Check if any built-in template already exists
2. If not found: insert all 18 built-in templates
3. If found: skip (idempotent — don't re-insert)

**Called By:** `TemplateContext` on mount

**Built-in Template Structure:**
```typescript
{
  id: 'tmpl_full_text',
  name: 'Full-Text Search',
  description: 'Search across all text fields',
  category: 'common',
  query: { query: matchQueryNode, pagination: { from: 0, size: 10 } },
  aggs: undefined,
  isBuiltIn: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

### Error Handling

**Common Errors:**
```typescript
try {
  const db = await initDB();
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('IndexedDB quota exceeded — storage full');
    // Offer to clear old history
  } else if (error.name === 'VersionError') {
    console.error('DB version mismatch — clear browser data and reload');
  } else {
    console.error('IndexedDB error:', error);
  }
}
```

### Storage Quota
- **Typical:** 50 MB per origin
- **Monitor:** If > 40 MB used, warn user
- **Clear Old Data:** Prune history, delete old custom templates

## Common Tasks

### Adding New Field to Template Schema
1. **types.ts:** Add field to `QueryTemplate` interface
2. **db.ts:** Update seed data if needed
3. **Backward compatibility:** Handle missing field in old stored data (use default value on read)
4. **Migration:** If removing field, update all existing docs (optional, depends on usage)

### Fixing Seed Data
1. **Idempotency check:** Verify `seedTemplates()` checks for existing data
2. **Built-in flag:** All seed templates have `isBuiltIn: true`
3. **IDs:** Use consistent ID format for built-in templates (e.g., `tmpl_category_name`)
4. **Timestamps:** Use consistent ISO datetime for all built-ins (e.g., `2024-01-01T00:00:00Z`)

### Implementing Auto-Prune in History
```typescript
export async function addToHistory(
  query: QueryNode,
  index: string,
  resultCount: number,
  options?: { took_ms?: number; error?: string }
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('query-history', 'readwrite');
  const store = tx.objectStore('query-history');

  // Add new entry
  const newEntry: QueryHistoryEntry = {
    id: uuidv4(),
    query,
    index_name: index,
    result_count: resultCount,
    timestamp: new Date().toISOString(),
    took_ms: options?.took_ms,
    error: options?.error
  };

  await store.add(newEntry);

  // Get current count
  const count = await store.count();

  // If > 50, delete oldest
  if (count > MAX_HISTORY_SIZE) {
    const toDelete = count - MAX_HISTORY_SIZE;
    const index = store.index('timestamp');
    const oldestEntries = await index.getAll(null, toDelete);
    for (const entry of oldestEntries) {
      await store.delete(entry.id);
    }
  }

  await tx.done;
}
```

### Searching Templates
**Important:** Search is in-memory (over loaded templates), not IndexedDB query

```typescript
export async function searchTemplates(term: string): Promise<QueryTemplate[]> {
  const all = await getAllTemplates();
  const searchTerm = term.toLowerCase();

  return all.filter(template =>
    template.name.toLowerCase().includes(searchTerm) ||
    template.description?.toLowerCase().includes(searchTerm) ||
    template.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}
```

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Built-in templates appear multiple times | Seed not idempotent OR no `isBuiltIn` check | Verify seed checks if any built-in exists before inserting; check delete checks `isBuiltIn` |
| History never prunes past 50 entries | Auto-prune logic not implemented OR skipped | Add prune check in `addToHistory()` after adding new entry |
| Delete fails on custom template | `isBuiltIn` flag not set to false | Verify all custom templates have `isBuiltIn: false` |
| Search returns no results | Search case-sensitive OR search fields incomplete | Use `.toLowerCase()` for comparison; ensure search checks all relevant fields |
| History slow with many entries | Fetching all history inefficient | Use pagination or index query; avoid loading 1000+ entries at once |
| Old data incompatible after schema change | Field added/removed without migration | Handle missing fields with defaults on read; test with old stored data |

## Do / Don't

| Do | Don't |
|---|---|
| Call `seedTemplates()` on app init | Manually insert built-in templates in multiple places |
| Check `isBuiltIn` before delete/update | Allow modification of built-in templates |
| Use UUID v4 for new template IDs | Use sequential IDs or timestamps |
| Implement auto-prune in `addToHistory()` | Manual cleanup via separate function |
| Test seed idempotency (call multiple times) | Assume seed only runs once |
| Use in-memory search over loaded templates | Query IndexedDB for every search |
| Generate timestamps on server (not client) | Use client timestamp (browser clock unreliable) |
| Validate template data before saving | Trust user input |
