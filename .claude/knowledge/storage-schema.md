# IndexedDB Storage Schema

## Purpose
Reference for IndexedDB setup, object store schemas, CRUD operations, and seed data.

## Key Files
| File | Purpose |
|---|---|
| `packages/storage/src/db.ts` | Database initialization and versioning |
| `packages/storage/src/templates.ts` | Template CRUD operations |
| `packages/storage/src/history.ts` | History CRUD operations |
| `packages/storage/src/index.ts` | Public API exports |

## Database Setup

### Database Name
```typescript
const DB_NAME = 'crystal-forge-db';
const DB_VERSION = 1;
```

### Initialization
```typescript
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('query-templates')) {
        createTemplateStore(db);
      }
      // ... repeat for other stores
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

## Object Stores

### 1. query-templates
**Purpose:** Store all saved query templates (built-in + user-created)

**Schema:**
```typescript
interface QueryTemplate {
  id: string;                    // UUID v4
  name: string;                  // Display name
  description?: string;          // Optional description
  category: 'common' | 'ecommerce' | 'advanced' | 'custom';
  tags?: string[];               // Searchable tags
  query: QueryState;             // Serialized query + pagination
  aggs?: Aggregation[];          // Optional aggregations
  isBuiltIn: boolean;            // true for default templates
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**KeyPath:** `id`

**Indexes:**
```typescript
store.createIndex('category', 'category', { unique: false });
store.createIndex('created_at', 'created_at', { unique: false });
store.createIndex('name', 'name', { unique: false });
```

**Built-In Templates (18 total):**

| Category | Template ID | Name |
|---|---|---|
| common | `tmpl_full_text` | Full-Text Search |
| common | `tmpl_exact_match` | Exact Keyword Match |
| common | `tmpl_range_query` | Range Query |
| common | `tmpl_exists_query` | Field Exists |
| common | `tmpl_bool_must` | AND (Must) Condition |
| ecommerce | `tmpl_product_search` | Product Search |
| ecommerce | `tmpl_price_range` | Price Range Filter |
| ecommerce | `tmpl_faceted_search` | Faceted Search |
| ecommerce | `tmpl_category_filter` | Category Filter |
| ecommerce | `tmpl_inventory_check` | Inventory Check |
| advanced | `tmpl_nested_query` | Nested Query |
| advanced | `tmpl_geo_distance` | Geo Distance Query |
| advanced | `tmpl_function_score` | Function Score Boost |
| advanced | `tmpl_fuzzy_match` | Fuzzy Matching |
| advanced | `tmpl_multi_match` | Multi-Field Search |

### 2. query-history
**Purpose:** Track executed queries with metadata

**Schema:**
```typescript
interface QueryHistoryEntry {
  id: string;                    // UUID v4
  query: QueryNode;              // Executed query
  index_name: string;            // Index name
  result_count: number;          // Total results
  timestamp: string;             // ISO timestamp when executed
  took_ms?: number;              // Query execution time
  error?: string;                // Error message if failed
}
```

**KeyPath:** `id`

**Indexes:**
```typescript
store.createIndex('timestamp', 'timestamp', { unique: false });
store.createIndex('index_name', 'index_name', { unique: false });
```

**Max Entries:** `MAX_HISTORY_SIZE = 50`
- Auto-pruning on `addToHistory()`: Delete oldest by timestamp when count exceeds 50

### 3. aggregation-templates
**Purpose:** Reusable aggregation patterns

**Schema:**
```typescript
interface AggregationTemplate {
  id: string;                    // UUID v4
  name: string;                  // Display name
  description?: string;          // Description
  category: 'common' | 'ecommerce' | 'advanced' | 'custom';
  agg_type: string;              // 'terms', 'stats', 'date_histogram', etc.
  aggregation: Aggregation;      // Full agg definition
  field_types: string[];         // Compatible field types
  isBuiltIn: boolean;
  created_at: string;
  updated_at: string;
}
```

**KeyPath:** `id`

**Indexes:**
```typescript
store.createIndex('category', 'category', { unique: false });
store.createIndex('agg_type', 'agg_type', { unique: false });
```

## CRUD Operations

### Templates

#### getAllTemplates()
```typescript
export async function getAllTemplates(): Promise<QueryTemplate[]>
```
**Returns:** All templates (built-in + custom) sorted by created_at DESC

#### getTemplatesByCategory(category)
```typescript
export async function getTemplatesByCategory(
  category: 'common' | 'ecommerce' | 'advanced' | 'custom'
): Promise<QueryTemplate[]>
```
**Returns:** Templates matching category, sorted by created_at DESC

#### saveTemplate(name, query, options)
```typescript
export async function saveTemplate(
  name: string,
  query: QueryState,
  options?: { category?: string; tags?: string[]; description?: string }
): Promise<QueryTemplate>
```
**Generates:** UUID v4 id, created_at, updated_at
**Returns:** Saved template with generated fields
**Idempotency:** None — creates new entry every time

#### updateTemplate(id, updates)
```typescript
export async function updateTemplate(
  id: string,
  updates: Partial<QueryTemplate>
): Promise<QueryTemplate>
```
**Preserves:** `id`, `created_at`, `isBuiltIn`
**Updates:** `updated_at` to current time
**Throws:** Error if template is built-in

#### deleteTemplate(id)
```typescript
export async function deleteTemplate(id: string): Promise<void>
```
**Throws:** Error if template `isBuiltIn === true`

#### searchTemplates(term)
```typescript
export async function searchTemplates(term: string): Promise<QueryTemplate[]>
```
**Search Fields:** name, description, tags (case-insensitive substring match)
**Implementation:** In-memory search over already-loaded templates (not IndexedDB query)

#### duplicateTemplate(id)
```typescript
export async function duplicateTemplate(id: string): Promise<QueryTemplate>
```
**Creates:** New template with copied content, new id, new timestamps
**Name:** Original name + " (copy)"
**Returns:** New template

### History

#### addToHistory(query, index, resultCount, options)
```typescript
export async function addToHistory(
  query: QueryNode,
  index: string,
  resultCount: number,
  options?: { took_ms?: number; error?: string }
): Promise<void>
```
**Generates:** UUID v4 id, current timestamp
**Auto-prunes:** If history count > 50, deletes oldest entries until count = 50
**Idempotency:** Always adds new entry (no de-duplication)

#### getAllHistory()
```typescript
export async function getAllHistory(): Promise<QueryHistoryEntry[]>
```
**Returns:** All history entries, sorted by timestamp DESC (newest first)

#### getHistoryForIndex(index)
```typescript
export async function getHistoryForIndex(index: string): Promise<QueryHistoryEntry[]>
```
**Returns:** History entries for specific index, sorted by timestamp DESC

#### getRecentHistory(limit = 10)
```typescript
export async function getRecentHistory(limit?: number): Promise<QueryHistoryEntry[]>
```
**Returns:** Last N history entries, sorted by timestamp DESC

#### clearHistory()
```typescript
export async function clearHistory(): Promise<void>
```
**Deletes:** All history entries

## Seed Data

### seedTemplates()
```typescript
export async function seedTemplates(): Promise<void>
```

**Behavior:**
- Checks if built-in templates already exist
- If not: inserts all 18 built-in templates
- Idempotent: Safe to call multiple times

**Example Built-In Template:**
```typescript
{
  id: 'tmpl_full_text',
  name: 'Full-Text Search',
  description: 'Search across all text fields',
  category: 'common',
  query: {
    query: { type: 'match', field: 'title', value: '' },
    pagination: { from: 0, size: 10 }
  },
  isBuiltIn: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

**Called By:** `TemplateContext` on mount via `useEffect`

## Database Error Handling

### Common Errors
```typescript
try {
  const db = await initDB();
  // ... operations
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('IndexedDB storage quota exceeded');
  } else if (error.name === 'VersionError') {
    console.error('Database version mismatch');
  } else {
    console.error('IndexedDB error:', error);
  }
}
```

### Storage Quota
- Typical quota: 50 MB per origin
- Warning: If using > 40 MB, prompt user to clear old history

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Built-in templates appear multiple times | `seedTemplates()` called multiple times without idempotency check | Verify idempotency logic; check if `isBuiltIn` filter is working |
| History keeps growing without limit | `MAX_HISTORY_SIZE` not enforced in `addToHistory()` | Add pruning logic: check count and delete oldest if > MAX_SIZE |
| Delete fails on built-in template | Missing `isBuiltIn` check | Always check `isBuiltIn` before allowing delete; throw error if true |
| Search returns no results | Search is case-sensitive or doesn't search all fields | Verify search implementation uses toLowerCase(); check field list |
| Transaction fails silently | No error handling in transaction callback | Wrap transaction in try-catch; log errors |
| Template with same name allowed | No uniqueness constraint on name | Optional: Add validation in `saveTemplate()` |

## Do / Don't

| Do | Don't |
|---|---|
| Call `seedTemplates()` on app init | Manually insert built-in templates |
| Use `updateTemplate()` and preserve `created_at` | Create new template when user edits |
| Generate UUID v4 for new template IDs | Use sequential IDs or timestamps |
| Check `isBuiltIn` before delete/update | Allow modification of built-in templates |
| Call `addToHistory()` immediately after successful query execution | Batch history inserts |
| Implement auto-pruning in `addToHistory()` | Manual cleanup via separate function |
| Test seed data idempotency | Assume single seed call during app lifetime |
| Use in-memory search for templates (loaded at startup) | Query IndexedDB for every search |
