# Aggregations

## Purpose
Reference for all 12 aggregation types, serialization formats, and UI rendering.

## Key Files
| File | Purpose |
|---|---|
| `packages/query-dsl/src/types.ts` | Aggregation type definitions |
| `packages/query-dsl/src/serializer.ts` | `serializeAggregation()` function |
| `apps/web/app/api/opensearch/aggregate/route.ts` | Aggregation API endpoint |
| `apps/web/components/AggregationsPanel.tsx` | Explore tab UI |

## Aggregation Type Definitions

### Terms Aggregation
**TypeScript Interface:**
```typescript
interface TermsAggregation {
  type: 'terms';
  field: string;
  size?: number;
  order?: { _count: 'asc' | 'desc' } | { _key: 'asc' | 'desc' };
  minDocCount?: number;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "terms": {
      "field": "fieldName",
      "size": 10,
      "order": { "_count": "desc" },
      "min_doc_count": 1
    }
  }
}
```

**Chart Type:** Bar chart (Recharts `BarChart`)
**Response Structure:** `{ buckets: [{ key, doc_count }] }`

### Stats Aggregation
**TypeScript Interface:**
```typescript
interface StatsAggregation {
  type: 'stats';
  field: string;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "stats": {
      "field": "fieldName"
    }
  }
}
```

**Chart Type:** StatCard grid (min, max, avg, sum, count)
**Response Structure:** `{ count, min, max, avg, sum }`

### Extended Stats Aggregation
**TypeScript Interface:**
```typescript
interface ExtendedStatsAggregation {
  type: 'extended_stats';
  field: string;
  sigma?: number;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "extended_stats": {
      "field": "fieldName",
      "sigma": 2
    }
  }
}
```

**Chart Type:** StatCard grid (includes std_deviation, variance, confidence bounds)
**Response Structure:** `{ count, min, max, avg, sum, std_deviation, variance, ... }`

### Date Histogram Aggregation
**TypeScript Interface:**
```typescript
interface DateHistogramAggregation {
  type: 'date_histogram';
  field: string;
  calendarInterval?: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';
  fixedInterval?: string;
  timezone?: string;
  minDocCount?: number;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "date_histogram": {
      "field": "fieldName",
      "calendar_interval": "month",
      "timezone": "UTC",
      "min_doc_count": 1
    }
  }
}
```

**Chart Type:** Line/Area chart (Recharts)
**Response Structure:** `{ buckets: [{ key_as_string, key, doc_count }] }`

### Histogram Aggregation
**TypeScript Interface:**
```typescript
interface HistogramAggregation {
  type: 'histogram';
  field: string;
  interval?: number;
  offset?: number;
  minDocCount?: number;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "histogram": {
      "field": "fieldName",
      "interval": 100,
      "offset": 0,
      "min_doc_count": 1
    }
  }
}
```

**Chart Type:** Bar chart (Recharts)
**Response Structure:** `{ buckets: [{ key, doc_count }] }`

### Range Aggregation
**TypeScript Interface:**
```typescript
interface RangeAggregation {
  type: 'range';
  field: string;
  ranges: Array<{ from?: number; to?: number; key?: string }>;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "range": {
      "field": "fieldName",
      "ranges": [
        { "from": 0, "to": 100 },
        { "from": 100, "to": 200 }
      ]
    }
  }
}
```

**Chart Type:** Bar chart
**Response Structure:** `{ buckets: [{ key, from?, to?, doc_count }] }`

### Cardinality Aggregation
**TypeScript Interface:**
```typescript
interface CardinalityAggregation {
  type: 'cardinality';
  field: string;
  precisionThreshold?: number;
}
```

**Serialization Format:**
```json
{
  "agg_name": {
    "cardinality": {
      "field": "fieldName",
      "precision_threshold": 100
    }
  }
}
```

**Chart Type:** Single StatCard (unique count)
**Response Structure:** `{ value }`

### Metric Aggregations (Avg, Sum, Min, Max, Value Count)

**Avg Aggregation:**
```typescript
interface AvgAggregation {
  type: 'avg';
  field: string;
}
```

**Sum Aggregation:**
```typescript
interface SumAggregation {
  type: 'sum';
  field: string;
}
```

**Min Aggregation:**
```typescript
interface MinAggregation {
  type: 'min';
  field: string;
}
```

**Max Aggregation:**
```typescript
interface MaxAggregation {
  type: 'max';
  field: string;
}
```

**Value Count Aggregation:**
```typescript
interface ValueCountAggregation {
  type: 'value_count';
  field: string;
}
```

**Serialization Format (all metric aggs):**
```json
{
  "agg_name": {
    "avg": { "field": "fieldName" }
  }
}
```

**Chart Type:** Single StatCard
**Response Structure:** `{ value }`

## API Endpoint: POST `/api/opensearch/aggregate`

### Request Body
```typescript
{
  index: string;
  aggregations: Aggregation[];
  query?: QueryNode;
}
```

### Smart Aggregation Type Selection
Automatic aggregation type by field type:

| Field Type | Auto Agg Type | Default Size/Interval |
|---|---|---|
| `keyword` | `terms` | size: 10 |
| `text` | `terms` | size: 10 |
| `boolean` | `terms` | size: 2 |
| `integer` / numeric | `stats` | — |
| `date` | `date_histogram` | calendar_interval: 'month' |
| `geo_point` | `geo_distance` | distance: '100km' |
| `object` / `nested` | `terms` | size: 10 |

**Function:** `getDefaultAggregationForFieldType(fieldType: string): Aggregation`

### Response Format
```typescript
{
  aggregations: {
    [aggName: string]: {
      buckets?: Array<{ key, doc_count, ... }>;
      value?: number;
      count?: number;
      min?: number;
      max?: number;
      avg?: number;
      sum?: number;
      // ... other stats fields
    }
  }
}
```

## Recharts Rendering by Agg Type

### Terms, Histogram, Range (Bar Chart)
```typescript
<BarChart data={buckets} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
  <XAxis dataKey="key" angle={-45} textAnchor="end" height={100} />
  <YAxis />
  <Tooltip />
  <Bar dataKey="doc_count" fill="#6366f1" />
</BarChart>
```

### Date Histogram (Area Chart)
```typescript
<AreaChart data={buckets}>
  <XAxis dataKey="key_as_string" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="doc_count" fill="#6366f1" stroke="#6366f1" />
</AreaChart>
```

### Stats, Extended Stats, Metric Aggs (StatCard Grid)
```typescript
<div className="grid grid-cols-2 gap-4">
  <StatCard label="Count" value={stats.count} />
  <StatCard label="Min" value={stats.min} />
  <StatCard label="Max" value={stats.max} />
  <StatCard label="Avg" value={stats.avg} />
</div>
```

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Aggregation returns empty buckets | `min_doc_count` too high | Lower `minDocCount` to 0 or 1 |
| Date histogram has gaps | No `min_doc_count` set; missing intervals not shown | Add `minDocCount: 0` to show all time periods |
| Cardinality value seems wrong | HyperLogLog approximation; not exact count | Explain to user that cardinality is approximate |
| Chart doesn't render | Response structure doesn't match expected shape | Log aggregation response; verify structure matches schema |
| Terms bucket keys are numbers | Field type is numeric but query string filters applied | Check field type mapping; ensure bucket response matches expected type |

## Do / Don't

| Do | Don't |
|---|---|
| Use `getDefaultAggregationForFieldType()` for auto-type selection | Hardcode aggregation types per field |
| Call `serializeAggregation()` before sending to OpenSearch | Manually construct aggregation JSON |
| Render different chart types by agg type | Use single chart component for all agg types |
| Set `minDocCount: 0` for date histograms if showing all intervals | Omit `min_doc_count` when you want all buckets |
| Store aggregation templates with category and field type | Store only raw JSON agg definitions |
| Test aggregations with large datasets (> 1M docs) | Test only with small sample data |
| Cache aggregation responses if query unchanged | Re-fetch aggregations on every page refresh |
