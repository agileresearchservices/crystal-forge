# API Routes Agent

---
**name:** api-routes
**description:** Handle tasks involving API routes, OpenSearch client, Docker host translation, connection management, and error handling. Use when modifying API routes in apps/web/app/api/opensearch/, OpenSearch client, or fixing connection/Docker issues.

---

## Domain Knowledge

Crystal Forge has 4 main API routes in `apps/web/app/api/opensearch/`. All routes must call `translateHostForDocker()` BEFORE creating OpenSearchClient and must call `client.connect()` BEFORE any other operation.

### Docker Host Translation
**Function:** `translateHostForDocker(host: string): string`

**Behavior:**
- If `OPENSEARCH_DOCKER_HOST` env var is set AND host contains `localhost` or `127.0.0.1`:
  - Replace `localhost` → `opensearch` (Docker network hostname)
  - Replace `127.0.0.1` → `opensearch`
  - Keep port unchanged
- Otherwise: return host unchanged

**Usage Pattern (ALL Routes):**
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  let host = body.host || process.env.OPENSEARCH_HOST || '';

  // CRITICAL: Translate host for Docker before creating client
  host = translateHostForDocker(host);

  const client = new OpenSearchClient({
    host,
    username: body.username,
    password: body.password,
    apiKey: body.apiKey
  });

  // CRITICAL: Connect before any operation
  await client.connect();

  // Now safe to execute queries
  const results = await client.search(...);
}
```

### Error Handling Pattern
**Three-tier approach:**

1. **OpenSearchClientError** → Return statusCode from error
2. **SyntaxError** (JSON parse) → Return 400
3. **Unknown error** → Return 500

```typescript
try {
  // ... API logic
} catch (error) {
  if (error instanceof OpenSearchClientError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  } else if (error instanceof SyntaxError) {
    return Response.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  } else {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### API Routes Overview

**POST /api/opensearch/connect**
- Verify connection + retrieve indices
- Body: `{ host, username, password, apiKey, authType }`
- Response: `{ success: true, indices: [...] }` OR `{ error: string, statusCode }`

**GET /api/opensearch/mapping?index=...&host=...&username=...&password=...**
- Get field mapping for index
- Returns: `{ fields: [{ name, type, isNested }, ...] }`

**POST /api/opensearch/execute**
- Execute query and return results
- Body: `{ host, index, query, from, size, username, password }`
- Response: `{ total, hits: [...], took }`

**POST /api/opensearch/aggregate**
- Execute aggregations
- Body: `{ host, index, aggregations, query?, username, password }`
- Response: `{ aggregations: { [name]: buckets/values } }`

### OpenSearchClient Class

**Methods:**
- `new OpenSearchClient({ host, username, password, apiKey?, awsSigV4? })` - Constructor
- `await client.connect()` - Validate connection; throw if unreachable
- `await client.getIndices()` - Get all indices
- `await client.getMapping(indexName)` - Get field list
- `await client.search(indexName, query, from, size)` - Execute query
- `await client.aggregate(indexName, aggregations, query?)` - Execute aggs

**Throws:** `OpenSearchClientError` with `{ message, statusCode, opensearchError }`

### Utility Functions

**parseMapping(mapping)** - Flatten nested mapping into FieldInfo[]
- Handles multi-fields (e.g., `title.keyword`)
- Flattens nested objects
- Returns array of `{ name, type, isNested }`

**safeParseJSON(text)** - Parse JSON with Content-Type validation
- Checks `Content-Type: application/json` header
- Returns parsed object or throws SyntaxError

### Auth Types
- **Basic:** `username` + `password`
- **API Key:** `apiKey` in format `base64(id:secret)`
- **AWS SigV4:** `region` + AWS credentials from environment

**Persistence:** Only `host`, `index`, `authType` stored in localStorage (NOT credentials for SigV4)

### Known Failure Modes
- **"Connection refused"** → Host translation incorrect OR OpenSearch not running
- **Credentials rejected** → Password encoding issue OR trailing spaces
- **Indices not shown** → User lacks permissions (add to `all_access` role)
- **Query returns 0 results** → Index empty OR query has no matching documents
- **Aggregation response malformed** → Serialization didn't call `serializeAggregation()`
- **Docker network issues** → `OPENSEARCH_DOCKER_HOST` env var not set OR hostname mismatch

## Common Tasks

### Adding New API Route
1. **Create file:** `apps/web/app/api/opensearch/[endpoint]/route.ts`
2. **Export function:** `export async function POST(req: Request) { ... }`
3. **Parse request:** `const body = await req.json();`
4. **Translate host:** `host = translateHostForDocker(host);`
5. **Create client:** `const client = new OpenSearchClient({...});`
6. **Connect:** `await client.connect();`
7. **Execute operation:** `const result = await client.METHOD(...);`
8. **Error handling:** Try/catch with three-tier approach
9. **Return response:** `Response.json({ ... })`

### Fixing Connection Issue
1. **Symptom:** "Connection refused" OR "Unable to connect"
2. **Check:** Is `OPENSEARCH_DOCKER_HOST` env var set? (Run `echo $OPENSEARCH_DOCKER_HOST`)
3. **Trace:** Host translation in route → verify output hostname
4. **Docker:** If using Docker Compose, ensure OpenSearch service is running (`docker ps`)
5. **Network:** From web container, ping `opensearch:9200` (not localhost)
6. **Security:** Check OpenSearch doesn't require SSL/TLS certs for localhost

### Updating Error Response Format
1. **Current:** Return `{ error: string, statusCode? }` OR `{ success: true, data: ... }`
2. **Standard:** Always return `{ error?: string, statusCode?, data?: any }`
3. **Trace:** Find all routes returning errors
4. **Update:** Consistent error format across all routes
5. **Test:** Verify error responses parsed correctly in client-side error handlers

### Adding Authentication Type
1. **Client:** Update `OpenSearchClient` constructor to accept new auth type
2. **Route:** Add case in route to extract + pass auth params
3. **Persistence:** Update ConnectionContext to store new auth params
4. **Test:** Connect with new auth type; verify connection succeeds

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Docker Compose fails to connect | Host not translated; using localhost instead of `opensearch` | Add `host = translateHostForDocker(host)` before creating client |
| Route doesn't send error response | Missing try/catch or error not caught | Wrap entire route in try/catch; log unexpected errors |
| Aggregation response empty | Route didn't call `serializeAggregation()` | Check route uses serializer before sending to OpenSearch |
| Cross-origin errors in browser | API route exists but not called correctly | Verify route URL matches request URL; check for typos |
| Connection succeeds but query fails | Client connected but missing required headers | Check Content-Type, User-Agent headers in request |

## Do / Don't

| Do | Don't |
|---|---|
| Call `translateHostForDocker()` BEFORE creating client | Create client with raw host string |
| Call `client.connect()` BEFORE any operation | Skip connection validation |
| Use three-tier error handling (OpenSearch/Syntax/Unknown) | Return 200 for all responses |
| Validate `body.host` before using | Trust user input |
| Return proper HTTP status codes (400, 401, 404, 500) | Always return 200 |
| Test routes with Docker Compose | Test only with native OpenSearch |
| Log errors for debugging | Silent failures |
