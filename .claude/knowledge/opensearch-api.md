# OpenSearch API Routes and Client

## Purpose
Reference for all API routes, OpenSearch client patterns, Docker host translation, and error handling.

## Key Files
| File | Purpose |
|---|---|
| `apps/web/app/api/opensearch/` | All API routes (directory) |
| `packages/opensearch-client/src/client.ts` | OpenSearchClient class |
| `packages/opensearch-client/src/utils.ts` | Utility functions (parseMapping, safeParseJSON) |
| `apps/web/lib/docker-host.ts` | Docker host translation (translateHostForDocker) |

## API Routes Overview

All routes located in `apps/web/app/api/opensearch/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/opensearch/connect` | POST | Verify connection + get indices |
| `/api/opensearch/mapping` | GET | Get field mapping for index |
| `/api/opensearch/execute` | POST | Execute query and return results |
| `/api/opensearch/aggregate` | POST | Execute aggregation and return buckets |

## Docker Host Translation

### translateHostForDocker()
```typescript
function translateHostForDocker(host: string): string
```

**Behavior:**
- If `OPENSEARCH_DOCKER_HOST` env var is set AND host contains `localhost` or `127.0.0.1`:
  - Replace `localhost` → `opensearch` (Docker network name)
  - Replace `127.0.0.1` → `opensearch`
  - Keep port unchanged
- Otherwise: return host unchanged

**Examples:**
```
// Development (Docker Compose)
Input:  https://localhost:9200
Output: https://opensearch:9200

// Development (native, no Docker)
Input:  https://localhost:9200
Output: https://localhost:9200 (OPENSEARCH_DOCKER_HOST not set)

// Production (remote server)
Input:  https://search.example.com:9200
Output: https://search.example.com:9200 (doesn't contain localhost)
```

**Usage in Every Route:**
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  let host = body.host || process.env.OPENSEARCH_HOST || '';

  host = translateHostForDocker(host);

  const client = new OpenSearchClient({
    host,
    username: body.username,
    password: body.password
  });
  // ... continue with API logic
}
```

### isRunningInDocker()
```typescript
function isRunningInDocker(): boolean {
  return !!process.env.OPENSEARCH_DOCKER_HOST;
}
```

**Usage:** Determine if Docker-specific configuration is active

## OpenSearchClient Class

### Constructor
```typescript
new OpenSearchClient({
  host: string;
  username: string;
  password: string;
  apiKey?: string;
  awsSigV4?: boolean;
  region?: string;
})
```

### Methods

#### connect()
```typescript
async connect(): Promise<void>
```

**Purpose:** Validate connection; throw error if server unreachable
**Must call before:** Any other operation
**Error handling:** Throws `OpenSearchClientError` with statusCode

**Usage:**
```typescript
const client = new OpenSearchClient({ host, username, password });
await client.connect(); // Validates server is reachable
```

#### getIndices()
```typescript
async getIndices(): Promise<IndexInfo[]>
```

**Returns:** Array of index metadata (name, doc count, size)
**Error handling:** Throws `OpenSearchClientError`

#### getMapping(indexName)
```typescript
async getMapping(indexName: string): Promise<FieldInfo[]>
```

**Returns:** Parsed field list with types
**Uses:** `parseMapping()` internally

#### search(indexName, query, from, size)
```typescript
async search(
  indexName: string,
  query: QueryNode,
  from: number = 0,
  size: number = 20
): Promise<SearchResponse>
```

**Returns:** Documents + metadata (total count, aggregations, etc.)

#### aggregate(indexName, aggregations, query?)
```typescript
async aggregate(
  indexName: string,
  aggregations: Aggregation[],
  query?: QueryNode
): Promise<AggregationResponse>
```

**Returns:** Aggregation buckets by name

## Error Handling Pattern

### Three-Tier Error Handling

All API routes follow this pattern:

```typescript
try {
  const client = new OpenSearchClient({...});
  await client.connect();
  const result = await client.search(...);
  return Response.json({ success: true, data: result });
} catch (error) {
  if (error instanceof OpenSearchClientError) {
    // Tier 1: OpenSearch-specific error
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  } else if (error instanceof SyntaxError) {
    // Tier 2: JSON parse error
    return Response.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  } else {
    // Tier 3: Unknown error
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### OpenSearchClientError
```typescript
interface OpenSearchClientError extends Error {
  statusCode: number;
  opensearchError?: any;
}
```

**Common Status Codes:**
- `400`: Malformed query
- `401`: Authentication failed
- `403`: Forbidden (permissions)
- `404`: Index not found
- `500`: Server error (OpenSearch crash)

## API Route Details

### POST /api/opensearch/connect
**Request:**
```typescript
{
  host: string;
  username: string;
  password: string;
  apiKey?: string;
  authType: 'basic' | 'apiKey' | 'awsSigV4';
}
```

**Response (Success):**
```typescript
{
  success: true,
  indices: [
    { name: 'my-index', docCount: 1000, size: '5MB' },
    { name: 'other-index', docCount: 500, size: '2MB' }
  ]
}
```

**Response (Error):**
```typescript
{
  error: 'Invalid credentials',
  statusCode: 401
}
```

### GET /api/opensearch/mapping?index=my-index&host=...
**Response:**
```typescript
{
  fields: [
    { name: 'title', type: 'text', isNested: false },
    { name: 'price', type: 'integer', isNested: false },
    { name: 'user.name', type: 'keyword', isNested: true }
  ]
}
```

### POST /api/opensearch/execute
**Request:**
```typescript
{
  host: string;
  index: string;
  query: QueryNode;
  from: number;
  size: number;
  username: string;
  password: string;
}
```

**Response:**
```typescript
{
  total: 1000,
  hits: [
    { _id: '1', _source: { title: 'Product A', price: 100 } },
    // ... more hits
  ],
  took: 15 // milliseconds
}
```

### POST /api/opensearch/aggregate
**Request:**
```typescript
{
  host: string;
  index: string;
  aggregations: Aggregation[];
  query?: QueryNode;
  username: string;
  password: string;
}
```

**Response:**
```typescript
{
  aggregations: {
    agg_0: {
      buckets: [
        { key: 'value', doc_count: 100 },
        { key: 'other', doc_count: 50 }
      ]
    }
  }
}
```

## Utility Functions

### parseMapping()
```typescript
function parseMapping(mapping: any): FieldInfo[]
```

**Purpose:** Flatten nested mapping into field list
**Handles:**
- Multi-fields (e.g., `title.keyword`)
- Nested objects
- Geo-point fields
- All 32 field types

**Example:**
```typescript
const mapping = {
  properties: {
    title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
    price: { type: 'integer' }
  }
};

const fields = parseMapping(mapping);
// Returns: [
//   { name: 'title', type: 'text' },
//   { name: 'title.keyword', type: 'keyword' },
//   { name: 'price', type: 'integer' }
// ]
```

### safeParseJSON()
```typescript
function safeParseJSON(text: string): any
```

**Purpose:** Parse JSON with proper Content-Type validation
**Checks:** `Content-Type: application/json` header
**Returns:** Parsed object
**Throws:** `SyntaxError` if invalid JSON

## Connection Persistence

### localStorage Keys
- `crystal-forge-connection-state`: `{ host, index, authType, username?, password?, apiKey? }`
- Does NOT persist AWS Signature V4 credentials
- Basic auth credentials stored only if user checked "Remember credentials"

### Restoration on Page Load
```typescript
function ConnectionContext() {
  useEffect(() => {
    const saved = localStorage.getItem('crystal-forge-connection-state');
    if (saved) {
      const state = JSON.parse(saved);
      setConnection(state);
    }
  }, []);
}
```

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| "Connection refused" error | Host translation incorrect or OpenSearch not running | Check `OPENSEARCH_DOCKER_HOST` env var; verify Docker network |
| Credentials rejected despite being correct | Password encoding issue | Ensure username/password are UTF-8; check for trailing spaces |
| Indices not shown | User lacks permissions | Add user to `all_access` role in OpenSearch security config |
| Query executes but returns 0 results | Index doesn't contain data or query has no bounds | Check index has documents; verify query is constructed correctly |
| Aggregation response malformed | API route not calling `serializeAggregation()` | Verify aggregation serialization before sending to OpenSearch |

## Do / Don't

| Do | Don't |
|---|---|
| Call `translateHostForDocker()` BEFORE creating OpenSearchClient | Create client with untranslated host |
| Call `client.connect()` before any operation | Skip connection validation |
| Catch `OpenSearchClientError` separately from other errors | Treat all errors the same |
| Return correct HTTP status codes (400, 401, 404, 500) | Return 200 for all responses |
| Use `parseMapping()` to flatten field lists | Manually traverse nested mapping structure |
| Validate credentials before showing indices | Auto-connect without validation |
| Store only `host`, `index`, `authType` in localStorage for non-basic auth | Store credentials for AWS SigV4 |
