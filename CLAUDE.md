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
- **Onboarding:** driver.js (interactive tours)
- **Date Utilities:** date-fns ^4.1.0

## Monorepo Structure

```text
crystal-forge/
├── apps/web/                     # Next.js 15 frontend
├── packages/
│   ├── query-dsl/                # Query types, serialization/deserialization
│   ├── query-validator/          # Query validation logic
│   ├── opensearch-client/        # OpenSearch API client wrapper
│   └── storage/                  # IndexedDB storage for templates & history
├── docker/
│   └── scripts/                  # Python scripts for data generation
│       ├── data_generator.py     # Generates 1000 sample documents
│       ├── bulk_loader.py        # Loads data into OpenSearch
│       └── index_mappings.json   # Custom analyzers & field mappings
├── Dockerfile                    # Multi-stage build for Next.js
├── docker-compose.yml            # Full stack: UI + OpenSearch + Dashboards
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

# Docker (recommended for quick start)
docker compose up -d              # Start all services (UI, OpenSearch, Dashboards)
docker compose down               # Stop all services
docker compose logs -f            # View logs
docker compose up --build         # Rebuild and start

# Docker scripts (interactive with status feedback)
./docker/scripts/setup.sh             # Interactive setup with health checks
./docker/scripts/setup.sh --build     # Force rebuild images
./docker/scripts/setup.sh --no-cache  # Full rebuild without cache
./docker/scripts/teardown.sh          # Stop containers (keep data)
./docker/scripts/teardown.sh --volumes # Stop and remove volumes
./docker/scripts/teardown.sh --clean  # Full cleanup (volumes + generated files)
```

## Docker Environment

The Docker setup provides a complete development/demo environment:

**Services:**
- **crystal-forge** (port 3000): Next.js production build
- **opensearch** (port 9200): Single-node OpenSearch 3.4.0 (security disabled)
- **opensearch-dashboards** (port 5601): OpenSearch Dashboards
- **data-loader**: Python scripts that seed sample data on startup

**Sample Data:**
- Index: `opensearch-demo` with 1000 documents
- Domains: e-commerce (350), technical docs (300), blog articles (200), user reviews (150)
- Custom analyzers: english_analyzer, phrase_analyzer, synonym_analyzer

**Architecture:**
- Multi-stage Dockerfile with `output: 'standalone'` for optimized builds (~200MB image)
- Docker network translation: API routes translate `localhost:9200` to `opensearch:9200`
- Health checks ensure proper startup order

**Key Files:**
- `Dockerfile`: Multi-stage build (base → deps → builder → runner)
- `docker-compose.yml`: Service definitions with health checks
- `docker/scripts/setup.sh`: Interactive setup script with health checks
- `docker/scripts/teardown.sh`: Cleanup script with options for volumes/data
- `docker/scripts/data_generator.py`: Generates deterministic sample data
- `docker/scripts/bulk_loader.py`: Loads data with retry logic
- `docker/scripts/index_mappings.json`: Custom analyzers and field mappings
- `apps/web/lib/docker-host.ts`: Translates localhost to Docker network names

**Common Workflows:**
```bash
# First time setup
./docker/scripts/setup.sh

# Daily start (fast - data persisted)
docker compose up -d

# Stop for the day (keep data)
./docker/scripts/teardown.sh

# Full reset (remove all data)
./docker/scripts/teardown.sh --clean

# Rebuild after code changes
docker compose up --build -d
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

### @crystal-forge/storage

Browser-local storage for templates and history using IndexedDB. Key exports:

- **Database:** `initDB()`, `getDB()`, `ensureDB()`
- **Templates:** `getAllTemplates()`, `getTemplatesByCategory()`, `saveTemplate()`, `updateTemplate()`, `deleteTemplate()`, `searchTemplates()`, `duplicateTemplate()`
- **History:** `addToHistory()`, `getAllHistory()`, `getHistoryForIndex()`, `getRecentHistory()`, `clearHistory()`
- **Aggregations:** Template CRUD for aggregation patterns
- **Seed Data:** `seedDefaultTemplates()` - 18 built-in templates across Common, E-commerce, and Advanced categories
- **Types:** `QueryTemplate`, `QueryHistoryEntry`, `AggregationTemplate`, `StorageConfig`

Object stores:
- `query-templates`: Full saved queries with metadata
- `query-history`: Execution history with results metadata
- `aggregation-templates`: Reusable aggregation patterns

## Architecture

### Query State Flow

1. User builds query visually → `QueryContext` state updates
2. `serializeQueryState()` converts to OpenSearch DSL JSON
3. API route `/api/opensearch/execute` sends to OpenSearch
4. Results stored in `QueryContext`, displayed in `ResultsPanel`

### Key Files

| Task | Files |
| ------ | ------- |
| Add query type | `packages/query-dsl/src/types.ts`, `serializer.ts`, `deserializer.ts` |
| Add UI component | `apps/web/components/` |
| Modify query builder | `apps/web/components/QueryBuilder/` |
| Change state management | `apps/web/context/QueryContext.tsx` |
| Add API endpoint | `apps/web/app/api/opensearch/` |
| Add shadcn component | `apps/web/components/ui/` |
| Modify onboarding tour | `apps/web/components/Tour/`, `apps/web/constants/tour-steps.ts` |
| Add help documentation | `apps/web/components/HelpMenu/` |
| Modify date inputs | `apps/web/components/DatePickers/` |

### Component Hierarchy

```text
page.tsx
├── ConnectionModal         # OpenSearch connection dialog
├── HelpMenu                # Help dropdown with guides and tour
│   ├── KeyboardShortcutsModal
│   ├── BoolQueryGuideModal
│   ├── FieldTypesGuideModal
│   └── QueryPatternsModal
├── AutoStartTour           # Onboarding tour (first-time users)
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

### Query Template Library & History

Users can save common query patterns as reusable templates and track execution history:

**Features:**
- **18 Built-in Templates** across Common (full-text, exact match, ranges, exists), E-commerce (product search, category filter, facets), and Advanced (nested, geo, function score) categories
- **Query History** - Automatic tracking of executed queries with results metadata (max 50 entries)
- **Search & Filtering** - Find templates by name, category, or tags
- **Template Actions** - Load, duplicate, edit, and delete templates
- **IndexedDB Storage** - Persistent browser-local storage with fast access

**Template Categories:**
- **Common:** Basic patterns every user needs (full-text, term, range, exists, boolean)
- **E-commerce:** Domain-specific patterns (product search, faceting, price ranges)
- **Advanced:** Complex patterns (nested queries, geo distance, function score, fuzzy matching)
- **Custom:** User-created templates

**Key Components:**
- `apps/web/context/TemplateContext.tsx` - State management
- `apps/web/components/TemplateLibrary/TemplateLibraryModal.tsx` - UI with tabs (Templates, History, Saved)
- `apps/web/components/TemplateLibrary/SaveTemplateModal.tsx` - Quick save form
- `apps/web/components/TemplateLibrary/QueryHistory.tsx` - History display and management
- `packages/storage/` - IndexedDB implementation with CRUD operations

**Storage Schema:**
- `query-templates`: `{id, name, description, category, tags, query, aggs, isBuiltIn, created_at, updated_at}`
- `query-history`: `{id, query, index_name, result_count, timestamp}`
- `aggregation-templates`: Reusable aggregation patterns with configuration

### Monaco Editor Enhancements

Advanced code editor with intelligent autocomplete and validation for OpenSearch Query DSL:

**Features:**
- **Context-Aware Autocomplete** - Suggests query types, aggregation types, bool clauses, and properties based on cursor position
- **JSON Schema Validation** - Visual indicators for valid/invalid queries with warnings
- **Dark Mode Support** - Automatic theme detection and switching
- **Snippets** - Quick-insert templates for common query patterns
- **Dev Tools Format** - Supports OpenSearch Dashboards dev tools format (`GET {index}/_search`)
- **Syntax Highlighting** - Color-coded JSON with folding support
- **Bidirectional Sync** - Edit in JSON or visual builder, changes reflect immediately

**Query Types Supported (23 total):**
- Full-text: match, match_phrase, match_phrase_prefix, multi_match, query_string, simple_query_string
- Exact matching: term, terms, ids
- Range queries: range
- Boolean logic: bool, boosting, constant_score, dis_max
- Special: nested, geo_distance, geo_bounding_box, match_all, match_none
- Advanced: function_score, wildcard, prefix, regexp, fuzzy, exists

**Key Components:**
- `apps/web/components/JSONPreview.tsx` - Monaco editor integration with schema and completions
- `apps/web/lib/opensearch-schema.ts` - Comprehensive JSON schema for OpenSearch DSL
- `apps/web/lib/monaco-completions.ts` - Context-aware completion and hover providers

### Visual Aggregation Builder

Intuitive UI for building complex aggregations without writing JSON:

**Features:**
- **All 11 Aggregation Types** - Terms, Stats, Extended Stats, Date Histogram, Histogram, Range, Cardinality, Avg, Sum, Min, Max, Value Count
- **Type-Specific Parameters** - Dynamic forms for each aggregation type with validation
- **Multiple Aggregations** - Add, edit, remove multiple aggregations in one view
- **Explore Tab** - Auto-generated aggregations for quick field analysis (existing feature)
- **Build Tab** - Manual aggregation builder for complex queries
- **Aggregation Templates** - Pre-configured patterns for common aggregations

**Parameter Forms:**
- **Terms Aggregation**: size, sort order (count/key, asc/desc)
- **Date Histogram**: calendar interval, timezone, min_doc_count
- **Histogram**: bucket interval, offset, extended bounds
- **Range**: Custom range definitions with add/remove
- **Cardinality**: Precision threshold for approximate counting
- **Extended Stats**: Standard deviation sigma for confidence bounds
- **Metric Aggregations** (Avg, Sum, Min, Max, Stats): Field-based calculations with no parameters

**Key Components:**
- `apps/web/components/AggregationsBuilder/AggregationBuilder.tsx` - Main builder with type selector
- `apps/web/components/AggregationsBuilder/AggregationParameterForm.tsx` - Dynamic parameter forms
- `apps/web/components/AggregationsPanel.tsx` - Tabbed interface (Explore/Build)

### Onboarding Tour

Interactive guided tour for first-time users using driver.js:

**Features:**
- **14-step tour** covering all major UI elements
- **Auto-start** for first-time users (2-second delay after page load)
- **Completion persistence** to localStorage (`crystal-forge:tour-completed`)
- **Replay option** via "Take a Tour" in the Help menu
- **Keyboard navigation** - fully accessible via arrow/enter keys
- **Custom theming** matching Crystal Forge design (indigo accent, dark mode support)

**Tour Steps:**
1. Welcome → Connect to OpenSearch → Connection Status → Field List → Field Search
2. Query Builder → Bool Clauses → Active Clause Indicator → JSON Preview
3. Explore Panel → Execute Query → Results Panel → Help Menu → Completion

**Key Files:**
- `apps/web/components/Tour/OnboardingTour.tsx` - `useOnboardingTour()` hook
- `apps/web/components/Tour/AutoStartTour.tsx` - Auto-start component
- `apps/web/constants/tour-steps.ts` - Tour step definitions

**Hook API:**
```tsx
const { startTour, hasTourCompleted, resetTourCompletion } = useOnboardingTour();
```

### Help Menu & Documentation

Dropdown menu providing contextual help and documentation:

**Menu Items (7 total):**
1. **Take a Tour** - Launches the onboarding tour
2. **Keyboard Shortcuts** - Modal with 6 shortcuts:
   - Tab/Shift+Tab - Navigate elements
   - Enter - Add field to query
   - Escape - Close modals
   - Ctrl+Enter - Execute query
   - Arrow Keys - Resize panels
3. **OpenSearch Query DSL Docs** - External link to official docs
4. **Bool Query Guide** - Explains Must/Should/Must Not/Filter clauses with SQL equivalents
5. **Field Types Reference** - Documents 9 field types with recommended operators
6. **Common Query Patterns** - Library of 10 query patterns with examples

**Key Files:**
- `apps/web/components/HelpMenu/HelpMenu.tsx` - Main dropdown component
- `apps/web/components/HelpMenu/KeyboardShortcutsModal.tsx` - Shortcuts guide
- `apps/web/components/HelpMenu/BoolQueryGuideModal.tsx` - Bool query explanation
- `apps/web/components/HelpMenu/FieldTypesGuideModal.tsx` - Field types reference
- `apps/web/components/HelpMenu/QueryPatternsModal.tsx` - Query patterns guide

### Date Picker Components

Specialized date input components for OpenSearch date queries:

**Components:**

1. **DatePicker** - Single datetime selection with calendar popup and time input
   ```tsx
   <DatePicker value={isoString} onChange={(iso) => handleChange(iso)} />
   ```

2. **DateRangePicker** - Dual-month calendar for date range selection
   - Quick range buttons: Last 7 days, Last 30 days, This month, This year
   - Returns `{ gte: string, lte: string }` for range queries
   ```tsx
   <DateRangePicker value={{ gte, lte }} onChange={(range) => handleChange(range)} />
   ```

3. **DateMathInput** - OpenSearch date math expression input
   - Help popover with 7 clickable examples: `now`, `now-7d`, `now-1h`, `now+30d`, `now/d`, `now/M`, `now/y`
   - Syntax guide for units (y, M, w, d, h, m, s) and rounding operators
   ```tsx
   <DateMathInput value={mathExpr} onChange={(expr) => handleChange(expr)} />
   ```

**Key Files:**
- `apps/web/components/DatePickers/DatePicker.tsx`
- `apps/web/components/DatePickers/DateRangePicker.tsx`
- `apps/web/components/DatePickers/DateMathInput.tsx`

**Dependencies:** `date-fns ^4.1.0`

### Real-time Validation

JSON validation with visual feedback:

**Current Features:**
- **JSON Parse Validation** - 500ms debounced validation on editor changes
- **Error Display** - Red border ring on editor, error message below
- **Schema Validation** - Monaco editor validates against OpenSearch query schema
- **Accessibility** - Error alerts with `role="alert"` and `aria-live="polite"`

**Error UI:**
- Red ring indicator: `ring-2 ring-red-500` on invalid JSON
- Error panel with AlertCircle icon and detailed error message
- Loading state: "Parsing JSON..." message during debounce

**Key Files:**
- `apps/web/components/JSONPreview.tsx` - JSON validation implementation
- `apps/web/lib/opensearch-schema.ts` - OpenSearch query JSON schema

## Environment Setup

Copy `.env.example` to `.env.local` in `apps/web/`:

```bash
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
- **Spellcheck Enabled** - Browser spell-check available on value inputs for better UX

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

## Accessibility & Recent Improvements (January 2026)

Crystal Forge maintains **perfect WCAG 2.1 Level AA compliance** (Lighthouse 100/100) with:

- **Color contrast:** All text 4.5:1+ ratio, 25+ fixes across 7+ components
- **Focus indicators:** Ring-2 style with offset on all interactive elements
- **Responsive design:** Mobile-first sizing, 44x44px+ touch targets
- **Keyboard support:** Full navigation + Arrow key panel resizing (±10%, Shift+25%)
- **Semantic HTML:** Proper heading hierarchy (h1 → h2 → h3+)

**Critical files:** `apps/web/app/page.tsx`, FieldList, QueryBuilder, ResultsPanel, button.tsx, resizable.tsx

Recent commits: `c5c9d1c` (color/focus), `a2f8e1b` (UX), `f825ab7` (hierarchy), `7f3e2d1` (keyboard)

## Feature Roadmap & Enhancement Opportunities

Crystal Forge covers 40+ query types, 30+ field types, 11 aggregations. Key enhancements (by priority):

**TIER 1 (High Impact):** Script-based queries, advanced aggregations (percentiles, composite, moving_average), query performance profiling/explain API, query templates

**TIER 2 (Medium Impact):** Search quality tools (A/B testing, relevancy analyzer), field collapse/rescore, more-like-this queries, named query debugging

**TIER 3 (Lower Priority):** Index health dashboard, advanced sorting, time series analytics, alerts/scheduling, code export (Python, Node.js, curl)

## Missing OpenSearch Query DSL Features

**Currently Implemented:** 26 out of 54 query types (~48% coverage, covers 95% of real-world use cases)

- **Full-Text:** match, match_phrase, match_phrase_prefix, multi_match, query_string
- **Term-Level:** term, terms, range, prefix, wildcard, regexp, fuzzy, exists, ids
- **Compound:** bool, dis_max, constant_score, boosting, function_score
- **Joining:** nested (with inner_hits, score_mode)
- **Geo:** geo_bounding_box, geo_distance, geo_shape
- **Special:** match_all, match_none

**High Priority Quick Wins:** simple_query_string (needs deserializer), match_bool_prefix, combined_fields, has_child/has_parent joining

**Medium Priority:** more_like_this, script_score, intervals, adjust_pure_negative parameter

**Lower Priority:** Span queries, percolator, pinned, wrapper, rank_feature, terms_set, geo_polygon
