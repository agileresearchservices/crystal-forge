# Drag-and-Drop Field Addition

## Purpose
Reference for field addition flow, ActiveClauseContext, and smart query node creation.

## Key Files
| File | Purpose |
|---|---|
| `apps/web/context/ActiveClauseContext.tsx` | Track selected bool clause tab |
| `apps/web/utils/createQueryNodeFromField.ts` | Smart default query node creation |
| `apps/web/app/page.tsx` | DndContext wrapper + droppable area |
| `apps/web/components/FieldList.tsx` | Field list with click + button + drag |
| `apps/web/components/QueryBuilder.tsx` | Droppable target area |

## ActiveClauseContext

### Purpose
Tracks which bool clause tab (Must/Should/Must Not/Filter) is currently active in the UI.

### Type Definition
```typescript
interface ActiveClause {
  activeClause: 'must' | 'should' | 'must_not' | 'filter';
  setActiveClause: (clause: 'must' | 'should' | 'must_not' | 'filter') => void;
}
```

### Provider Setup
```tsx
export function ActiveClauseProvider({ children }: { children: React.ReactNode }) {
  const [activeClause, setActiveClause] = useState<ClauseName>('must');

  return (
    <ActiveClauseContext.Provider value={{ activeClause, setActiveClause }}>
      {children}
    </ActiveClauseContext.Provider>
  );
}
```

### Usage in Components
```typescript
import { useActiveClause } from '@/context/ActiveClauseContext';

function BooleanGroup() {
  const { activeClause, setActiveClause } = useActiveClause();

  return (
    <Tabs value={activeClause} onValueChange={setActiveClause}>
      <TabsList>
        <TabsTrigger value="must">Must</TabsTrigger>
        <TabsTrigger value="should">Should</TabsTrigger>
        <TabsTrigger value="must_not">Must Not</TabsTrigger>
        <TabsTrigger value="filter">Filter</TabsTrigger>
      </TabsList>
      {/* Clause content */}
    </Tabs>
  );
}
```

## Field Addition Methods

### Method 1: Click Entire Field
```tsx
<button
  onClick={() => handleAddField(field)}
  className="w-full px-3 py-2 hover:bg-gray-100 text-left"
>
  <span className="font-medium">{field.name}</span>
  <span className="text-xs text-gray-500">{field.type}</span>
</button>
```

**Flow:**
1. User clicks field item
2. `handleAddField()` called
3. Get `activeClause` from context
4. Create query node via `createQueryNodeFromField()`
5. Dispatch `ADD_NODE` action with clause path

### Method 2: Click + Button
```tsx
<div className="flex items-center justify-between px-3 py-2">
  <span>{field.name}</span>
  <button
    onClick={() => handleAddField(field)}
    className="p-1 hover:bg-gray-200 rounded"
    aria-label={`Add ${field.name} to query`}
  >
    <PlusIcon size={16} />
  </button>
</div>
```

**Same flow as Method 1** — button variant for explicit interaction

### Method 3: Drag-and-Drop
```tsx
// Field item is draggable
<Draggable id={field.name} data={field}>
  <div>{field.name}</div>
</Draggable>

// QueryBuilder is droppable
<Droppable id="query-builder" onDrop={handleDropField}>
  <QueryBuilder />
</Droppable>
```

**Flow:**
1. User drags field from sidebar
2. User drops onto QueryBuilder
3. `handleDropField()` triggered
4. Get `activeClause` from context
5. Create query node
6. Dispatch `ADD_NODE` action

## createQueryNodeFromField() Function

### Signature
```typescript
function createQueryNodeFromField(field: FieldInfo): QueryNode
```

### Smart Type Selection

| Field Type | Default Query Type | Example Node |
|---|---|---|
| `text` | `match` | `{ type: 'match', field: 'title', value: '', id: 'node_1...' }` |
| `keyword` | `term` | `{ type: 'term', field: 'title', values: [], id: 'node_2...' }` |
| `integer` / numeric | `range` | `{ type: 'range', field: 'price', gte: '', lte: '', id: 'node_3...' }` |
| `date` | `range` | `{ type: 'range', field: 'created', gte: '', lte: '', id: 'node_4...' }` |
| `boolean` | `term` | `{ type: 'term', field: 'active', values: [true], id: 'node_5...' }` |
| `nested` | `nested` | `{ type: 'nested', path: 'user', query: { match_all: {} }, id: 'node_6...' }` |
| `geo_point` | `geo_distance` | `{ type: 'geo_distance', field: 'location', distance: '100km', lat: 0, lon: 0, id: 'node_7...' }` |
| Other | `match` | `{ type: 'match', field: 'fieldName', value: '', id: 'node_8...' }` |

### Implementation Pattern
```typescript
export function createQueryNodeFromField(field: FieldInfo): QueryNode {
  const nodeId = generateNodeId();

  switch (field.type) {
    case 'text':
      return {
        id: nodeId,
        type: 'match',
        field: field.name,
        value: ''
      };

    case 'keyword':
      return {
        id: nodeId,
        type: 'term',
        field: field.name,
        values: []
      };

    case 'integer':
    case 'long':
    case 'float':
    case 'double':
    case 'date':
      return {
        id: nodeId,
        type: 'range',
        field: field.name,
        gte: '',
        lte: ''
      };

    case 'boolean':
      return {
        id: nodeId,
        type: 'term',
        field: field.name,
        values: [true]
      };

    case 'nested':
      return {
        id: nodeId,
        type: 'nested',
        path: field.name,
        query: { type: 'match_all' }
      };

    case 'geo_point':
      return {
        id: nodeId,
        type: 'geo_distance',
        field: field.name,
        distance: '100km',
        lat: 0,
        lon: 0
      };

    default:
      return {
        id: nodeId,
        type: 'match',
        field: field.name,
        value: ''
      };
  }
}
```

## Add Field Handler

### Complete Implementation
```typescript
function handleAddField(field: FieldInfo) {
  const { activeClause } = useActiveClause();
  const { dispatch } = useQueryContext();

  const newNode = createQueryNodeFromField(field);
  const clausePath = [activeClause];

  dispatch({
    type: 'ADD_NODE',
    clausePath,
    newNode
  });

  // Optional: Show toast confirmation
  showToast(`Added ${field.name} to ${activeClause} clause`);
}
```

## DndContext Setup in page.tsx

```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function HomePage() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'query-builder') {
      const field = active.data.current as FieldInfo;
      handleAddField(field);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        <aside className="w-64">
          <FieldList onAddField={handleAddField} />
        </aside>

        <main className="flex-1">
          <div id="query-builder" className="droppable-target">
            <QueryBuilder />
          </div>
        </main>
      </div>
    </DndContext>
  );
}
```

## Drag Attributes

### Draggable Field Item
```tsx
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer!.effectAllowed = 'copy';
    e.dataTransfer!.setData('field', JSON.stringify(field));
  }}
  className="cursor-grab active:cursor-grabbing"
>
  {field.name}
</div>
```

### Droppable Target
```tsx
<div
  id="query-builder"
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    const field = JSON.parse(e.dataTransfer!.getData('field'));
    handleAddField(field);
  }}
  className="border-2 border-dashed border-gray-300 rounded"
>
  Drop fields here or use + button
</div>
```

## Auto-Wrap Behavior

**Important:** When adding a node to a non-bool root:

```typescript
// Before:
{ "query": { "type": "match", "field": "title", "value": "search" } }

// After adding node to ['must'] clause:
{
  "query": {
    "type": "bool",
    "must": [
      { "type": "match", "field": "title", "value": "search" },
      { "type": "term", "field": "category", "values": [] }  // New node
    ],
    "should": [],
    "must_not": [],
    "filter": []
  }
}
```

**Handled by:** `addNodeAtPath()` in QueryContext

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Field not added to selected clause | `activeClause` context not read | Verify `useActiveClause()` hook is called; check Provider wrapping |
| Wrong query type created | `createQueryNodeFromField()` field type mismatch | Check field type from mapping; may need to debug FieldInfo |
| Node added but not visible | `addNodeAtPath()` returns new tree but state not updated | Verify QueryContext dispatch is working; check Redux pattern |
| Drag-drop doesn't work | DndContext not wrapping components | Check that DndContext wraps both FieldList and QueryBuilder |
| Mobile field addition fails | Drag-drop not supported on touch | Ensure click + button method works as fallback |
| Clause tab doesn't track selection | `activeClause` state not synced | Verify tab `onValueChange` calls `setActiveClause` |

## Do / Don't

| Do | Don't |
|---|---|
| Use `createQueryNodeFromField()` for all field additions | Hardcode default node types in components |
| Read `activeClause` from context before adding | Use hardcoded clause path |
| Call `generateNodeId()` in `createQueryNodeFromField()` | Reuse node IDs |
| Support both click and drag-drop methods | Drag-drop only; mobile users can't add fields |
| Test field addition with all 32 field types | Test with only common types |
| Show visual feedback when field added | Silently add field without confirmation |
| Allow click on entire field area | Click + button only; small touch target |
