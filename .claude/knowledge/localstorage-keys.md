# localStorage Keys Reference

## Purpose
Complete reference for all 7 localStorage keys, what each stores, and format specification.

## All Keys Summary

| Key | Purpose | Format | Max Size |
|---|---|---|---|
| `crystal-forge-panel-sizes` | Panel widths/heights | JSON object | ~500 bytes |
| `crystal-forge-connection-state` | OpenSearch connection config | JSON object | ~1 KB |
| `crystal-forge:tour-completed` | Tour completion flag | String 'true' | 4 bytes |
| `crystal-forge:theme` | Light/dark mode preference | String enum | 5 bytes |
| `crystal-forge:results-tab` | Active results tab | String enum | 15 bytes |
| `crystal-forge-query-state` | Current query (auto-save) | Serialized JSON | ~5 KB |
| `crystal-forge:layout-mode` | Visual/DSL editor mode | String enum | 10 bytes |

## Key Details

### 1. crystal-forge-panel-sizes

**Purpose:** Persist user's custom panel widths/heights across page reloads

**Format:**
```json
{
  "vertical": [percentageOrPixels, percentageOrPixels],
  "horizontal": [percentageOrPixels, percentageOrPixels, percentageOrPixels]
}
```

**Structure:**
- `vertical`: [top panel size, bottom results panel size]
- `horizontal`: [field list size, query builder size, explore panel size]

**Example:**
```json
{
  "vertical": [60, 40],
  "horizontal": [20, 50, 30]
}
```

**Type:** Percentages (can be floats, should sum to ~100)

**Set By:** `useResizablePanels` hook in `hooks/useResizablePanels.ts`

**Read By:** Page load → restore panel sizes before render

**Lifecycle:** Updated on every resize; persisted after user stops dragging

**Clear:** Delete key to reset to default sizes

### 2. crystal-forge-connection-state

**Purpose:** Persist OpenSearch connection info so user doesn't need to reconnect on page reload

**Format:**
```json
{
  "host": "https://localhost:9200",
  "index": "opensearch-demo",
  "authType": "basic",
  "username": "admin",
  "password": "admin"
}
```

**Alternative (API Key):**
```json
{
  "host": "https://api.example.com:9200",
  "index": "my-index",
  "authType": "apiKey",
  "apiKey": "base64encodedkey:secret"
}
```

**Alternative (AWS SigV4):**
```json
{
  "host": "https://opensearch.example.com:9200",
  "index": "my-index",
  "authType": "awsSigV4",
  "region": "us-east-1"
}
```

**Important:** Does NOT store AWS SigV4 credentials (region only)

**Set By:** `ConnectionContext` on successful connection

**Read By:** Page load → auto-connect if key exists and auth type allows

**Lifecycle:** Updated after successful connection; persists indefinitely

**Security:** Basic auth stored in plaintext (localStorage is not secure); warn user about credentials

**Clear:** Delete key to force reconnection dialog on next load

### 3. crystal-forge:tour-completed

**Purpose:** Track if user has completed the onboarding tour

**Format:**
```
'true'  (string literal)
```

**Values:**
- Present and `'true'` → tour completed; don't auto-start
- Absent or any other value → tour not completed; auto-start (if not connected)

**Set By:** `useOnboardingTour()` hook when tour finishes

**Read By:** `AutoStartTour` component on mount

**Lifecycle:** Set once; persists until user resets tour

**Clear:** Use "Reset Tour" in Help menu → removes key

## 4. crystal-forge:theme

**Purpose:** Persist user's light/dark mode preference

**Format:**
```
'light' | 'dark' | 'system'
```

**Values:**
- `'light'` → Force light mode
- `'dark'` → Force dark mode
- `'system'` → Follow OS preference (use with `prefers-color-scheme`)

**Set By:** Theme toggle button → calls `setTheme()`

**Read By:** `ThemeProvider` (next-themes) on mount

**Lifecycle:** Updated on each theme toggle; persists across sessions

**Default:** `'system'` if key not set

**Clear:** Delete key to reset to system default

### 5. crystal-forge:results-tab

**Purpose:** Track which results tab user last viewed (restore on page reload)

**Format:**
```
'documents' | 'aggregations' | 'metadata' | 'json'
```

**Mappings:**
- `'documents'` → Documents tab (query results)
- `'aggregations'` → Aggregations tab (from last executed query)
- `'metadata'` → Metadata tab (query stats, took ms, etc.)
- `'json'` → Raw JSON response tab

**Set By:** `ResultsPanel` component when user clicks tab

**Read By:** `ResultsPanel` on mount → restore selected tab

**Lifecycle:** Updated on each tab switch; persists across page reloads

**Default:** `'documents'` if key not set

**Clear:** Delete key to default to documents tab

### 6. crystal-forge-query-state

**Purpose:** Auto-save current query so user doesn't lose work on page reload

**Format:**
Serialized `QueryState` object:
```json
{
  "query": {
    "type": "bool",
    "must": [
      {
        "id": "node_1_123456",
        "type": "match",
        "field": "title",
        "value": "search term"
      }
    ],
    "should": [],
    "must_not": [],
    "filter": []
  },
  "pagination": {
    "from": 0,
    "size": 20
  }
}
```

**Set By:** `QueryContext` → dispatched on every query change with debounce (500ms)

**Read By:** `QueryProvider` on mount → restore previous query if key exists

**Lifecycle:** Updated frequently during editing; persists until explicitly cleared

**Debounce:** 500ms (avoid excessive writes while user typing)

**Clear:** Manual "New Query" action OR delete key → start with fresh `{ match_all: {} }`

**Size:** ~5 KB for typical complex queries; monitor quota if storing very large queries

### 7. crystal-forge:layout-mode

**Purpose:** Persist visual vs. text editor mode preference (if app supports both)

**Format:**
```
'visual' | 'dsl'
```

**Values:**
- `'visual'` → Show visual query builder
- `'dsl'` → Show JSON/DSL editor as primary interface

**Set By:** Layout mode toggle (if implemented) OR app configuration

**Read By:** Page layout component → determines which view to show

**Lifecycle:** Updated on mode toggle; persists until changed again

**Default:** `'visual'` if key not set

**Clear:** Delete key to reset to visual mode

## Code Examples

### Reading All Keys on Page Load
```typescript
function restoreAppState() {
  const panelSizes = JSON.parse(
    localStorage.getItem('crystal-forge-panel-sizes') || '{}'
  );
  const connectionState = JSON.parse(
    localStorage.getItem('crystal-forge-connection-state') || '{}'
  );
  const tourCompleted = localStorage.getItem('crystal-forge:tour-completed') === 'true';
  const theme = localStorage.getItem('crystal-forge:theme') || 'system';
  const resultsTab = localStorage.getItem('crystal-forge:results-tab') || 'documents';
  const queryState = JSON.parse(
    localStorage.getItem('crystal-forge-query-state') || '{}'
  );
  const layoutMode = localStorage.getItem('crystal-forge:layout-mode') || 'visual';

  return { panelSizes, connectionState, tourCompleted, theme, resultsTab, queryState, layoutMode };
}
```

### Clearing All Data
```typescript
function clearAllStorageData() {
  const keys = [
    'crystal-forge-panel-sizes',
    'crystal-forge-connection-state',
    'crystal-forge:tour-completed',
    'crystal-forge:theme',
    'crystal-forge:results-tab',
    'crystal-forge-query-state',
    'crystal-forge:layout-mode'
  ];

  keys.forEach(key => localStorage.removeItem(key));
}
```

### Getting Storage Size
```typescript
function estimateStorageSize() {
  let totalSize = 0;
  for (const key in localStorage) {
    if (key.startsWith('crystal-forge')) {
      totalSize += localStorage[key].length;
    }
  }
  return `${(totalSize / 1024).toFixed(2)} KB`;
}
```

## Storage Quota and Limits

**Typical Quota:** 5-10 MB per origin (varies by browser)

**Crystal Forge Usage:** ~8 KB typical, ~50 KB maximum for complex queries

**Warning Threshold:** Warn user if > 1 MB (unlikely, but possible with history)

**Cleanup Options:**
```typescript
// Clear old history beyond 50 entries
function pruneHistory() {
  const history = JSON.parse(localStorage.getItem('crystal-forge-query-history') || '[]');
  if (history.length > 50) {
    history.splice(0, history.length - 50);
    localStorage.setItem('crystal-forge-query-history', JSON.stringify(history));
  }
}

// Clear auto-save query state
function clearAutoSave() {
  localStorage.removeItem('crystal-forge-query-state');
}
```

## Browser Compatibility

**Support:** All modern browsers (Chrome, Firefox, Safari, Edge)

**Limitations:**
- Private/Incognito mode: localStorage may not persist
- Storage quota varies by browser
- localStorage is synchronous (can block on large reads)

**Fallback:** If localStorage unavailable:
- Use `sessionStorage` (data cleared on tab close)
- Or skip persistence entirely (warn user)

## Privacy & Security Notes

**What's Stored:**
- ✅ Query structure (safe)
- ✅ Index name (safe)
- ✅ Panel sizes (safe)
- ⚠️ Connection credentials (basic auth in plaintext — not secure)
- ⚠️ OpenSearch host (URL exposed in localStorage)

**Recommendations:**
- ⚠️ Don't store sensitive data in localStorage
- ⚠️ Warn users about credential persistence
- ⚠️ Use HTTPS only
- ⚠️ Recommend clearing data before sharing device

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Panel sizes don't restore | JSON parsing error or key mismatch | Check localStorage key name; validate JSON format |
| Auto-reconnect doesn't work | Connection state key deleted or format changed | Verify key name and structure; check if auth info is correct |
| Tour starts every time | localStorage key not set to `'true'` (string) | Check set operation uses string `'true'`, not boolean |
| Wrong theme on load | localStorage key has incorrect value | Validate theme values are `'light'`, `'dark'`, or `'system'` |
| Query lost on reload | Query state not saving with debounce | Check debounce delay; verify dispatch is called on query change |
| Storage quota error | Too much data in localStorage | Prune history; clear auto-save; implement cleanup |

## Do / Don't

| Do | Don't |
|---|---|
| Use consistent key names (avoid typos) | Hard-code different key names in different files |
| Parse JSON with fallback: `JSON.parse(...) \|\| {}` | Trust localStorage always contains valid JSON |
| Debounce high-frequency updates (500ms) | Update localStorage on every keystroke |
| Validate data format before restoring | Blindly restore without type checking |
| Clear data on logout/disconnect | Leave sensitive data in localStorage |
| Test persistence with DevTools > Application > localStorage | Only test in production |
| Document every key and its format | Keep keys undocumented |
| Provide clear storage management in settings | Hide storage options from user |
