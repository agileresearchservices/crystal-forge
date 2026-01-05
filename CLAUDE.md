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

### OpenSearch Expert

Comprehensive personal skill for OpenSearch query design, optimization, data modeling, and search relevancy. Available across all projects.

**Location:** `~/.claude/skills/opensearch-expert/` (Personal global skill)

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
- All OpenSearch Query DSL types and patterns (40+ query types, 30+ field types, 11+ aggregation types)
- Data modeling and field mappings
- Search relevancy and ranking (BM25, boosting)
- Query optimization and performance tuning
- Aggregations and analytics patterns
- Index management and configuration
- Advanced features (percolator, more_like_this, nested, geo queries, etc.)
- Crystal Forge architecture and query builder patterns

### Web Designer Expert

Specialized personal skill for UI design, accessibility, responsive design, and performance optimization. Available across all projects.

**Location:** `~/.claude/skills/web-designer/` (Personal global skill)

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
- Crystal Forge component architecture and design system

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

## Feature Roadmap & Enhancement Opportunities

Crystal Forge has excellent core coverage of basic-to-intermediate OpenSearch features, with 40+ query types, 30+ field types, and 11 aggregation types. However, there are opportunities for advanced capabilities.

### TIER 1: Critical Missing Features (High Impact)

#### 1. Script-Based Queries & Scoring

- **Why:** Scripts enable sophisticated custom logic (e.g., boost results where price < competitor_price)
- **Impact:** 15-20% of production search applications use scripts
- **Status:** Not yet implemented
- **Effort:** Medium

#### 2. Advanced Aggregations (50% Coverage Gap)

Missing: percentiles, percentile_ranks, moving_average, derivative, cumulative_sum, bucket_sort, composite, serial_differencing, matrix_stats

- **Why:** Essential for analytics (E-commerce: distribution analysis, DevOps: trend analysis)
- **Impact:** Very High - composite aggregations critical for large datasets
- **Status:** Basic aggregations working (terms, date_histogram, range, stats)
- **Effort:** Medium-High

#### 3. Query Performance Analysis & Debugging

- **Why:** Users can't see why queries are slow or which clauses cost most
- **Missing:** Profile API integration, Explain API visualization, query cost estimation
- **Status:** Not yet implemented
- **Effort:** Medium-High

#### 4. Query Templates & Reusability

- **Why:** Common query patterns repeated manually; no save/load mechanism
- **Missing:** Query templates, history/versioning, collaboration features
- **Status:** Not yet implemented
- **Effort:** Medium

### TIER 2: Important Enhancements (Medium Impact)

#### 5. Search Quality & Relevancy Tools

- A/B Testing Helper - Compare two queries side-by-side
- Relevancy Analyzer - Show score breakdown per result
- Query Rewrite Suggester - Simplification suggestions
- Synonym & Analyzer Preview - See how text is tokenized
- Similar Documents Explorer - Find documents similar to top result

#### 6. Advanced Result Processing

- **Field Collapse** - Deduplication by field (show 1 best result per product/category)
- **Rescore Queries** - Multi-tier ranking (fast first pass, expensive second pass on top-N)
- **Search_after Cursor Navigation** - Cursor-based pagination (better than offset)
- **Field Transformations** - Display different field than search field

#### 7. Advanced Query Types

- **Percolator Queries** - Inverse search ("which saved searches match this doc?")
- **More-Like-This Queries** - Find similar documents
- **Span Queries** - Advanced phrase/proximity search
- **Combined Fields Query** - Multi-field relevancy with single BM25
- **Pinned Query** - Guarantee specific documents at top

#### 8. Named Queries & Query Analysis

- Automatically add `_name` parameter for debugging
- Show in results which clause matched each document

### TIER 3: Valuable Additions (Lower Priority)

- Index & Field Analysis (health dashboard, cardinality, statistics)
- Query Composition Helpers (conditional logic, visualization, complexity metric)
- Advanced Sorting (script-based, geo distance, randomization)
- Time Series & Analytics (trend visualization, anomaly detection, forecasting)
- Alerts & Monitoring (query threshold alerts, scheduled execution, webhooks)
- Integration & Export (OpenSearch Dashboards format, code generation, API integration)

### Implementation Priority Recommendation

**Phase 1: Foundation (Highest ROI)** - 2-3 months

1. Script Query Support (3 weeks)
2. Advanced Aggregations Phase 1: percentiles, moving_average, composite (3 weeks)
3. Profile/Explain API UI (2 weeks)
4. Query Save/Templates (2 weeks)

**Phase 2: Enhancement (Medium Priority)** - 2-3 months

1. Field Collapse & Rescore (2 weeks)
2. More-like-this & Percolator (2 weeks)
3. Query Versioning & History (1 week)
4. Relevancy Testing Tools (2 weeks)

**Phase 3: Polish (Nice to Have)** - 1-2 months

- Advanced sorting options
- Index health dashboard
- Code export features (Python, Node.js, curl)
- Alerts & scheduling

### Feature Impact Matrix

| Feature              | Effort | Impact | User Type              |
| -------------------- | ------ | ------ | ---------------------- |
| Script Queries       | 5/10   | 9/10   | Power Users            |
| Advanced Aggregations | 6/10   | 9/10   | Analysts, DevOps       |
| Profile/Explain UI   | 5/10   | 8/10   | All Users              |
| Query Templates      | 4/10   | 8/10   | All Users              |
| Field Collapse       | 3/10   | 7/10   | E-commerce             |
| Rescore Queries      | 3/10   | 7/10   | Performance-focused    |
| More-like-this       | 2/10   | 6/10   | Content/Recommendation |
| Percolator           | 3/10   | 6/10   | Alerts/Triggers        |
| Query Versioning     | 2/10   | 6/10   | Teams                  |
| Relevancy Tools      | 6/10   | 7/10   | Search Teams           |

## Missing OpenSearch Query DSL Features

Crystal Forge implements **26 out of 54** query types from the complete OpenSearch Query DSL specification (~48% coverage). The implemented types cover the vast majority of real-world use cases.

### Currently Implemented (26 types)

**Full-Text:** match, match_phrase, match_phrase_prefix, multi_match, query_string
**Term-Level:** term, terms, range, prefix, wildcard, regexp, fuzzy, exists, ids
**Compound:** bool, dis_max, constant_score, boosting, function_score
**Joining:** nested (with inner_hits, score_mode)
**Geo:** geo_bounding_box, geo_distance, geo_shape
**Special:** match_all, match_none
**Aggregations:** terms, date_histogram, range, stats, cardinality, avg, sum, min, max, value_count

### High Priority Missing Features (Quick Wins)

1. **simple_query_string** - Never throws exceptions, unlike query_string. Essential for user-facing search.
   - Status: Type definition exists, missing deserializer
   - Effort: Small

2. **match_bool_prefix** - Autocomplete queries (last term as prefix)
   - Status: Missing completely
   - Effort: Small

3. **combined_fields** - Multi-field search with unified relevance score
   - Status: Missing completely
   - Effort: Medium

4. **Joining Queries** - has_child, has_parent, parent_id for parent-child relationships
   - Status: Missing completely
   - Effort: Large

### Medium Priority Missing Features (Power User)

1. **more_like_this** - Find similar documents
2. **script_score** - Custom scoring with Painless scripts
3. **intervals** - Advanced phrase matching with position rules

### Low Priority Missing Features (Specialized)

- Span queries (9 variants) - Position-aware linguistic analysis
- Percolate Query - Inverse search (which saved searches match this doc?)
- Pinned Query - Force specific documents to top
- Wrapper Query - Pass raw JSON for unsupported queries
- Rank Feature Query - Boost based on rank_feature field values
- Terms Set Query - Match if minimum number of terms match
- Geo Polygon - Deprecated but still supported

### Missing Parameters on Existing Types

- **bool query:** `adjust_pure_negative` - Handle pure negative bool queries
- **range query:** All parameters implemented

### Implementation Recommendations

#### Phase 1: Quick Wins (Effort: 3-4 hours)

- simple_query_string deserializer
- match_bool_prefix complete implementation
- adjust_pure_negative parameter

#### Phase 2: Core Features (Effort: 11 hours)

- combined_fields
- Joining queries (has_child, has_parent, parent_id)

#### Phase 3: Advanced Features (Effort: 13 hours)

- more_like_this
- script_score
- intervals

#### Phase 4: Specialized (Defer unless requested)

- Span queries
- Percolator, pinned, wrapper, rank_feature, terms_set
