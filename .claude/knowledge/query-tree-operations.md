# Query Tree Operations

## Purpose
Reference for tree mutation, NodePath semantics, and QueryContext reducer actions.

## Key Files
| File | Purpose |
|---|---|
| `apps/web/context/QueryContext.tsx` | State management + tree helper functions |
| `apps/web/utils/nodeHelpers.ts` | Tree traversal utilities |
| `apps/web/hooks/useQueryContext.ts` | Custom hook to access context + dispatch |

## NodePath Format

**Definition:** `NodePath = string[]`

A path describes the location of any node in the query tree.

### Examples
```
[]                          // Root node
['must', '0']               // First node in 'must' clause
['should', '2']             // Third node in 'should' clause
['filter', '0', 'must', '1'] // Second node in nested bool's 'must' clause
```

### Structure Rules
- **Even indices:** Clause names or field names (`'must'`, `'should'`, `'must_not'`, `'filter'`)
- **Odd indices:** String indices (`'0'`, `'1'`, `'2'`, etc.)
- **Root is empty array:** `[]` always refers to the root query node

## Tree Helper Functions

### findNodeAtPath(tree, path)
```typescript
function findNodeAtPath(tree: QueryNode, path: NodePath): QueryNode | null
```
**Returns:** Node at path, or `null` if path invalid
**Usage:** `const node = findNodeAtPath(queryState.query, ['must', '0']);`
**Gotcha:** Does NOT create intermediate nodes; path must exist

### updateNodeAtPath(tree, path, newNode)
```typescript
function updateNodeAtPath(tree: QueryNode, path: NodePath, newNode: QueryNode): QueryNode
```
**Returns:** NEW tree (immutable) with node at path replaced
**Usage:** Typical reducer action:
```typescript
case 'UPDATE_NODE':
  return {
    ...state,
    query: updateNodeAtPath(state.query, action.path, action.newNode)
  };
```
**Gotcha:** Does NOT create intermediate nodes

### addNodeAtPath(tree, path, newNode)
```typescript
function addNodeAtPath(tree: QueryNode, path: NodePath, newNode: QueryNode): QueryNode
```
**Returns:** NEW tree with node appended to clause at path

**Critical Behavior — Auto-wrap:**
If root is not a `BoolQueryNode`:
- Before: `{ match: { field: "value" } }`
- After adding node to `['must']`: `{ bool: { must: [{ match: {...} }, newNode] } }`

**Usage:** User drags field onto query builder:
```typescript
case 'ADD_NODE':
  return {
    ...state,
    query: addNodeAtPath(state.query, action.clausePath, action.newNode)
  };
```

### removeNodeAtPath(tree, path)
```typescript
function removeNodeAtPath(tree: QueryNode, path: NodePath): QueryNode
```
**Returns:** NEW tree with node at path removed

**Cleanup Behavior:**
- If clause becomes empty after removal, clause remains (empty array)
- If entire bool becomes empty (all clauses empty), simplify to `{ match_all: {} }`

## Query State Structure

```typescript
interface QueryState {
  query: QueryNode;
  pagination: {
    from: number;
    size: number;
  };
  sort?: string;
}
```

## QueryContext Reducer Actions

All actions use immutable updates; reducer returns new state.

| Action Type | Payload | Result |
|---|---|---|
| `SET_QUERY` | `{ query: QueryNode }` | Replace entire query tree |
| `SET_PAGINATION` | `{ from: number, size: number }` | Update pagination |
| `SET_SORT` | `{ sort: string }` | Update sort expression |
| `UPDATE_NODE` | `{ path: NodePath, newNode: QueryNode }` | Update single node |
| `ADD_NODE` | `{ clausePath: NodePath, newNode: QueryNode }` | Add node to clause (auto-wraps non-bool root) |
| `REMOVE_NODE` | `{ path: NodePath }` | Remove node; cleans up empty bool |
| `CLEAR_QUERY` | None | Reset to `{ match_all: {} }` |
| `SET_ACTIVE_CLAUSE` | `{ clause: ClauseName }` | Update active tab (via ActiveClauseContext) |
| `TOGGLE_CLAUSE_VISIBILITY` | `{ clause: ClauseName }` | Hide/show clause in UI |
| `DUPLICATE_NODE` | `{ path: NodePath, newPath: NodePath }` | Copy node to another location |

## Helper Functions

### generateNodeId()
```typescript
function generateNodeId(): string
```
**Returns:** Unique node ID in format `node_<counter>_<timestamp>`
**Example:** `node_42_1677821234567`
**Storage:** Not persisted; ephemeral for single session

### createEmptyBoolQuery()
```typescript
function createEmptyBoolQuery(): BoolQueryNode
```
**Returns:** New bool node with all clauses as empty arrays:
```typescript
{
  id: generateNodeId(),
  type: 'bool',
  must: [],
  should: [],
  must_not: [],
  filter: []
}
```

### isEmptyBoolQuery(node)
```typescript
function isEmptyBoolQuery(node: QueryNode): boolean
```
**Returns:** `true` if node is bool with all clauses empty

## QueryContext Hook Usage

```typescript
import { useQueryContext } from '@/context/QueryContext';

function MyComponent() {
  const { state, dispatch } = useQueryContext();

  // Access state
  const { query, pagination } = state;

  // Dispatch actions
  dispatch({
    type: 'ADD_NODE',
    clausePath: ['must'],
    newNode: matchNode
  });
}
```

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Path traversal returns null | Path index out of bounds (e.g., `['must', '5']` when only 3 nodes exist) | Validate path before calling helper; bounds-check in reducer |
| Non-bool root doesn't auto-wrap on ADD_NODE | Code calls `addNodeAtPath` with non-bool root but expects wrap | Check that `addNodeAtPath` logic handles this case; may need to trace deserializer |
| Empty bool persists after removeNodeAtPath | Cleanup logic missing | Verify that `removeNodeAtPath` calls simplification when all clauses empty |
| Node ID collision | Two nodes generate same ID | `generateNodeId()` uses global counter + timestamp — collisions extremely rare; add counter increment on each ID generation |
| User edits JSON, tree structure breaks | Deserializer produces invalid QueryNode | Test deserializer with malformed JSON; add validation in `SET_QUERY` action |

## Do / Don't

| Do | Don't |
|---|---|
| Use `updateNodeAtPath`, `addNodeAtPath`, `removeNodeAtPath` — they handle immutability | Mutate tree directly (e.g., `state.query.must.push(...)`) |
| Validate path exists before calling helper | Call helpers with arbitrary paths without bounds-checking |
| Test tree operations with nested bool queries | Assume flat bool queries only |
| Dispatch reducer actions through `dispatch()` | Manually call tree helpers outside reducer |
| Roundtrip test: `deserialize → tree op → serialize → validate` | Modify tree without testing serialization output |
| Use `NodePath` type annotation for all path parameters | Use `any[]` or `string[]` for paths |
| Call `generateNodeId()` only when creating new nodes | Reuse node IDs across trees |
