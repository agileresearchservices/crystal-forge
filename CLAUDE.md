# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crystal Forge is a visual query builder UI for OpenSearch that enables users to construct complex queries without writing JSON DSL manually.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5+ (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Context + useReducer
- **Code Editor:** Monaco Editor (@monaco-editor/react)
- **Testing:** Vitest + React Testing Library
- **Build System:** Turborepo + tsup (for packages)

## Monorepo Structure

```
crystal-forge/
├── apps/web/                     # Next.js 15 frontend
├── packages/
│   ├── query-dsl/                # Query types, serialization/deserialization
│   ├── query-validator/          # Query validation logic
│   └── opensearch-client/        # OpenSearch API client wrapper
├── package.json                  # Root workspace config
├── turbo.json                    # Turborepo pipeline config
└── tsconfig.json                 # Base TypeScript config
```

## Development Commands

```bash
# Install and run
npm install                       # Install all dependencies
npm run dev                       # Start web app on localhost:3000

# Build
npm run build                     # Build all packages and apps

# Test
npm run test                      # Run all tests
npm run test --filter=web         # Run web app tests only
cd apps/web && npm run test -- --watch  # Watch mode for web tests

# Lint and format
npm run lint                      # Lint all
npm run format                    # Format with Prettier
```

## Package Details

### @crystal-forge/query-dsl
Core types and serialization logic. Key exports:
- **Types:** `QueryNode`, `QueryState`, `QueryType`, `BoolQueryNode`, `MatchQueryNode`, `RangeQueryNode`, etc.
- **Serialization:** `serializeQuery()`, `serializeQueryState()`, `serializeToJson()`
- **Deserialization:** `deserializeQuery()`, `deserializeQueryState()`
- **Operators:** `getOperatorsForFieldType()`, `FIELD_TYPE_OPERATORS`

### @crystal-forge/query-validator
Query validation. Key exports:
- `validateQueryNode()`, `validateQueryState()`
- `ValidationResult`, `ValidationError` types

### @crystal-forge/opensearch-client
OpenSearch API wrapper. Key exports:
- `OpenSearchClient` class (connect, getIndices, getMapping, search)
- `parseMapping()` for schema parsing
- Types: `ConnectionConfig`, `IndexInfo`, `SearchResponse`, `FieldInfo`

## Architecture

### Query State Flow
1. User builds query visually → `QueryContext` state updates
2. `serializeQueryState()` converts to OpenSearch DSL JSON
3. API route `/api/opensearch/execute` sends to OpenSearch
4. Results stored in `QueryContext`, displayed in `ResultsPanel`

### Key Files
| Task | Files |
|------|-------|
| Add query type | `packages/query-dsl/src/types.ts`, `serializer.ts`, `deserializer.ts` |
| Add UI component | `apps/web/components/` |
| Modify query builder | `apps/web/components/QueryBuilder/` |
| Change state management | `apps/web/context/QueryContext.tsx` |
| Add API endpoint | `apps/web/app/api/opensearch/` |
| Add shadcn component | `apps/web/components/ui/` |

### Component Hierarchy
```
page.tsx
├── ConnectionModal         # OpenSearch connection dialog
├── FieldList               # Sidebar with index fields (draggable)
├── QueryBuilder            # Main visual builder (droppable)
│   ├── QueryNode           # Individual query clause
│   ├── BooleanGroup        # Bool query (must/should/must_not/filter)
│   └── OperatorSelector    # Query operator dropdown
├── JSONPreview             # Monaco editor showing DSL
├── AggregationsPanel       # Field exploration via aggregations
└── ResultsPanel            # Query results table
```

### Drag-and-Drop Field Addition
Fields can be added to the query builder in two ways:
1. **Drag-and-drop**: Drag a field from the sidebar and drop anywhere on the query builder area
2. **Click +**: Click the + button next to any field

Both methods add the field to the **currently selected clause tab** (Must/Should/Must Not/Filter). Smart query type selection based on field type:
- `text` → match query
- `keyword` → term query
- `numeric/date` → range query
- `boolean` → term query (true)

Key files:
- `apps/web/context/ActiveClauseContext.tsx` - Tracks selected clause tab
- `apps/web/utils/createQueryNodeFromField.ts` - Smart node creation
- `apps/web/app/page.tsx` - DndContext and droppable wrapper

### Aggregations for Field Exploration
The "Explore" tab (right panel) allows exploring field values before building queries:
- Select a field → auto-runs appropriate aggregation
- **Terms agg** for keyword/boolean fields (clickable buckets)
- **Stats agg** for numeric fields (min/max/avg/sum)
- **Date histogram** for date fields (clickable time buckets)
- Click any bucket → adds it as a filter to the query
- Auto-refreshes with 500ms debounce when query changes

Key files:
- `packages/query-dsl/src/types.ts` - Aggregation type definitions
- `packages/query-dsl/src/serializer.ts` - `serializeAggregation()`, `serializeAggregations()`
- `apps/web/app/api/opensearch/aggregate/route.ts` - Aggregation API endpoint
- `apps/web/components/AggregationsPanel.tsx` - Aggregation UI

## Environment Setup

Copy `.env.example` to `.env.local` in `apps/web/`:
```
OPENSEARCH_HOST=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
```

## Git Workflow

- Branch naming: `feature/query-builder`, `fix/range-query-bug`
- Commit format: `feat: add match query support`, `fix: null handling in range query`

## Claude Code Commands

### OpenSearch DSL Expert

Specialized agent for reviewing and improving the query-dsl package implementation.

```bash
# Full implementation review against OpenSearch spec
/dsl-expert-review

# Generate test cases for a specific query type
/dsl-expert-tests match
/dsl-expert-tests bool
/dsl-expert-tests        # all query types

# Find missing OpenSearch features
/dsl-expert-gaps

# General DSL expertise (interactive)
/dsl-expert review       # review serialization logic
/dsl-expert edges        # identify edge cases
/dsl-expert types        # review TypeScript types
/dsl-expert roundtrip    # verify serialize/deserialize consistency
```

The DSL Expert has deep knowledge of:
- OpenSearch Query DSL specification
- All query types and their parameters
- Query vs filter context implications
- Field type compatibility rules
- Performance considerations

### Web Designer Expert

Specialized expert for UI design, accessibility, responsive design, and performance optimization.

```bash
# Get design help for Crystal Forge components
/web-designer

# Ask for specific design assistance:
# - Component design and layout
# - Accessibility audits (WCAG 2.1)
# - Responsive design patterns
# - Performance optimization
# - Next.js integration
# - Design system improvements
```

The Web Designer Expert has expertise in:
- UI/Component design and layout patterns
- Accessibility standards (WCAG 2.1 Levels A, AA, AAA)
- Responsive design (mobile-first, Grid, Flexbox, Container Queries)
- Core Web Vitals optimization
- Next.js 15+ App Router and Server Components
- Design systems and Tailwind CSS
- shadcn/ui component patterns
