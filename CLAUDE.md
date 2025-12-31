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

### Resizable Panels
Users can resize the UI panels to customize their workflow:
- **Horizontal resize** (Desktop only): Drag the divider between Query Builder and JSON/Explore panel to widen either section
- **Vertical resize** (All devices): Drag the divider between top section and Results panel to expand either section
- **Persistence**: Panel sizes are saved to localStorage and restored on page reload
- **Responsive**: Resize handles are hidden on mobile (<768px) to prevent accidental resizing

Technical implementation:
- Uses `react-resizable-panels` v2.1.9 (via shadcn/ui)
- Keyboard navigation: Arrow keys adjust panel size by 10%, Shift+Arrow for 25%
- Accessibility: Full ARIA labels, focus indicators, screen reader support

Key files:
- `apps/web/hooks/useResizablePanels.ts` - Hook managing panel sizes and localStorage
- `apps/web/components/ui/resizable.tsx` - Resizable panel components (shadcn/ui)
- `apps/web/app/page.tsx` - Layout using ResizablePanelGroup and ResizablePanel

### Bidirectional JSON-Query Builder Sync
The JSON editor now works both ways - build visually OR paste/edit JSON:
- **Paste JSON**: Paste any OpenSearch query into the JSON editor and the query builder updates automatically
- **Edit JSON**: Make manual edits to the JSON and see changes reflected in the builder in real-time
- **Dev Tools Format**: Supports both plain JSON and OpenSearch Dev Tools format (`GET {index}/_search\n{...}`)
- **Live Preview**: Changes debounced at 500ms to avoid excessive re-parsing
- **Error Handling**: Invalid JSON shows clear red border + error message below editor
- **Sync Strategy**: Uses `isEditing` flag to prevent infinite loops between builder and JSON editor

Technical implementation:
- Editor is now editable (`readOnly: false`) with `onChange` handler
- Debounced parsing with `lodash.debounce` (500ms delay)
- `deserializeQueryState()` converts JSON back to QueryNode
- Dev Tools format automatically stripped using regex: `^(GET|POST|PUT|DELETE|HEAD)\s+`
- Error UI with accessibility: `role="alert"`, `aria-live="polite"`
- Prevents re-serialization during editing by tracking `isEditing` state

Key files:
- `apps/web/components/JSONPreview.tsx` - Main bidirectional sync implementation
- Uses `deserializeQueryState()` from `@crystal-forge/query-dsl`
- `lodash.debounce` for debounced updates

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

### OpenSearch Expert (Global Skill)

Comprehensive global skill for OpenSearch query design, optimization, data modeling, and search relevancy. Available in any OpenSearch project.

```bash
# Query design and optimization
/opensearch-expert design a query for searching products by title
/opensearch-expert my query is slow. How do I optimize it?

# Data modeling
/opensearch-expert design field mappings for an e-commerce index
/opensearch-expert configure analyzers for text search

# Relevancy tuning
/opensearch-expert improve search results with field boosting
/opensearch-expert debug why top result isn't relevant

# Aggregations and analytics
/opensearch-expert build aggregations to analyze sales by product and date
/opensearch-expert design nested aggregations for analytics

# Performance analysis
/opensearch-expert identify performance bottlenecks in my queries
/opensearch-expert what's the optimal shard strategy for my data?
```

The OpenSearch Expert has deep knowledge of:
- All OpenSearch Query DSL types and patterns
- Data modeling and field mappings
- Search relevancy and ranking (BM25, boosting)
- Query optimization and performance tuning
- Aggregations and analytics patterns
- Index management and configuration
- Advanced features (percolator, more_like_this, etc.)

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

## Accessibility Features

Crystal Forge follows **WCAG 2.1 Level AA** standards for web accessibility.

### Keyboard Navigation
- **Tab/Shift+Tab**: Navigate through all interactive elements
- **Enter/Space**: Activate buttons, select options, and add fields to query
- **Escape**: Close modal dialogs
- **Field List**: Click any field or use the always-visible `+` button to add to active clause
- All features are fully accessible without a mouse

### Screen Reader Support
- **Live Regions**: Status changes announced automatically (connection status, JSON parsing, index selection)
- **Semantic HTML**: Proper use of headings, buttons, and landmark roles
- **ARIA Labels**: All interactive elements have descriptive labels
- **Error Messages**: Accessibility-marked with `role="alert"` for important notifications

### Visual Accessibility
- **Focus Indicators**: Clear indigo focus rings on all interactive elements
- **Color Contrast**: All text meets WCAG AA standards (4.5:1 minimum for normal text)
- **Dark Mode**: Full support with appropriate contrast adjustments
- **Loading States**: Visual spinners with accompanying text announcements

### Field List (Drag-and-Drop)
- Click entire field item to add to active clause tab
- Use `+` button (always visible) for explicit field addition
- Drag fields to specific bool clauses (mouse/touch only)
- Search via keyboard: Type to filter, Escape to clear search

### Query Builder
- Tab through bool clauses and query nodes
- Press Enter/Space to remove clauses or execute queries
- All node removals accessible via keyboard

### Connection Modal
- Tab focuses the connection form fields
- Escape key closes the modal
- Focus returns to trigger button on close
- Connection status announced to screen readers

### Copy-to-Clipboard
- Copy button with visual feedback (changes color when clicked)
- Full Dev Tools format copied (GET + JSON) ready for OpenSearch Dashboards
- Timeout feedback: "Copied!" message appears for 2 seconds

### Color & Contrast
- Primary focus color: Indigo-500 (#6366f1)
- Error messages: Red with 7:1 contrast
- Success messages: Green-600 (#16a34a) with 4.1:1 contrast
- Status indicator: Green-600 animated pulse

### Testing for Accessibility
Run automated checks with:
```bash
# Lighthouse accessibility audit (Chrome DevTools)
# Target: 100/100 score

# axe DevTools browser extension
# Run scan, should show 0 violations
```

Manual testing:
- Tab through the entire app with keyboard only
- Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- Verify focus indicators visible in all themes
- Test error states and recovery paths
