# OpenSearch Query Builder - High-Level Development Plan

## Project Vision

Build a modern, web-based visual query builder for OpenSearch that enables developers and analysts to construct complex queries without writing JSON DSL manually. Think "Mirage (2019) but modern, complete, and production-ready."

**Target Users:** DevOps engineers, data engineers, analysts, and developers using OpenSearch.

**Primary Goal:** Reduce query construction time, minimize DSL syntax errors, and enable exploration of complex queries through visual composition.

---

## Phase Overview

| Phase | Duration | Priority | Goal |
|-------|----------|----------|------|
| **Phase 0: Setup** | 1 week | P0 | Project scaffold, architecture decisions |
| **Phase 1: MVP Core** | 6-8 weeks | P0 | Visual builder + JSON editor + execution |
| **Phase 2: Polish & Features** | 4-6 weeks | P1 | Code export, templates, advanced options |
| **Phase 3: Advanced Features** | 4-6 weeks | P2 | Aggregations, saved queries, collaboration |
| **Phase 4: Production** | 2-3 weeks | P3 | Security, performance, deployment |

**Total estimated MVP→Production: 4-5 months**

---

## Phase 0: Setup & Architecture (1 week)

### Objectives
- Project scaffolding and repository structure
- Architecture decisions finalized
- Development environment validated
- Design system started

### Deliverables

**1. Repository Structure**
```
opensearch-query-builder/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/               # App router pages
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities & helpers
│   │   ├── context/           # React context
│   │   └── styles/            # Global styles
│   └── api/                   # Backend (optional, Phase 2)
├── packages/
│   ├── query-dsl/             # OpenSearch DSL query builder logic
│   ├── query-validator/       # DSL validation
│   └── opensearch-client/     # OpenSearch API wrapper
├── docs/                       # Project documentation
└── README.md
```

**2. Tech Stack Decisions (FINAL)**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5+
- **UI Library:** React 18+
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Context + useReducer (avoid Redux complexity initially)
- **Code Editor:** Monaco Editor (JSON/query display)
- **HTTP Client:** fetch + axios for OpenSearch calls
- **Form Handling:** React Hook Form (if needed)
- **Testing:** Vitest + React Testing Library
- **Deployment:** Vercel (recommended) or Docker for self-hosted

**3. Architecture Decisions**
- **Split Responsibilities:**
  - Visual Query State (React Context) - canonical source of truth
  - DSL Serialization (packages/query-dsl) - converts state → JSON
  - Deserialization (packages/query-dsl) - converts JSON → state for editing
  - OpenSearch Integration - separate API layer
  
- **Query State Structure:**
```typescript
interface QueryState {
  query: QueryNode;              // The query tree
  filters: FilterClause[];       // Additional filters
  aggregations: AggregationNode[];
  size: number;
  from: number;
  sorting: SortClause[];
  timeout: string;
  highlight?: HighlightConfig;
  explain?: boolean;
}

type QueryNode = 
  | MatchQuery
  | TermQuery
  | BoolQuery
  | RangeQuery
  | PrefixQuery
  | WildcardQuery
  | RegexQuery
  | NestedQuery
  | // ... other query types
```

- **Component Hierarchy:**
```
App
├── Layout
│   ├── Sidebar (Query Navigator)
│   └── MainContent
│       ├── QueryBuilder (Visual Editor)
│       │   ├── QueryNodeComponent (Recursive)
│       │   ├── BooleanGroupComponent
│       │   └── OperatorSelector
│       ├── JSONPreview (Real-time)
│       └── ResultsPanel
│           ├── Results Table
│           ├── Aggregations
│           └── Metadata
└── ConnectionModal
```

**4. Design System Setup**
- Create color palette, spacing, typography
- Set up shadcn/ui components in local registry
- Document design patterns (buttons, inputs, cards, modals)

**5. OpenSearch Client Validation**
- Test connectivity to sample OpenSearch instance
- Validate schema fetching
- Test query execution

### Success Criteria
- ✅ Repository structure established and documented
- ✅ All dependencies installed and working
- ✅ TypeScript strict mode enabled
- ✅ Can fetch schema from test OpenSearch instance
- ✅ Initial component library visible in Storybook

---

## Phase 1: MVP Core (6-8 weeks)

### Objectives
Build the fundamental visual query builder with live JSON and execution.

### Key Features

#### 1.1 Connection Management
**What:** UI for connecting to OpenSearch instances
- [x] Modal for cluster connection (host, auth, index selection)
- [x] Connection validation and error handling
- [x] Store connection in session/localStorage
- [x] Display connection status in header
- [x] Support for:
  - Basic auth (username/password)
  - API key auth
  - AWS SigV4 (for AWS OpenSearch)

**Components:**
- `ConnectionModal` - Connection setup form
- `ConnectionSelector` - Quick switch between saved connections
- `ConnectionStatus` - Connection indicator in header

**Testing:**
- Mock OpenSearch responses
- Test auth methods
- Test error scenarios

#### 1.2 Index & Schema Discovery
**What:** Fetch and display available indices and field mappings
- [x] List all indices in cluster
- [x] Fetch index mapping (field names, types, analyzers)
- [x] Cache schema for current session
- [x] Display field list in sidebar
- [x] Show field type badges (text, keyword, number, date, geo_point, etc.)
- [x] Provide field search/filter

**Components:**
- `IndexSelector` - Dropdown to choose index
- `FieldList` - Sidebar showing available fields
- `FieldTypeIndicator` - Visual indicator of field type

**Key Logic:**
- Parse OpenSearch mapping into flat field list
- Handle nested fields (show as expandable)
- Cache mappings to avoid repeated API calls

#### 1.3 Visual Query Builder (Core)
**What:** Block-based UI for building queries visually

**Query Types to Support (MVP):**
- ✅ Bool Query (with must/should/must_not/filter)
- ✅ Match Query
- ✅ Term Query
- ✅ Range Query
- ✅ Prefix Query
- ✅ Wildcard Query
- ✅ Match All Query
- ✅ Exists Query
- ✅ Nested Query (basic)

**UI Pattern:**
- Hierarchical tree view of query clauses
- Each query block shows field selector → operator dropdown → value input
- Operator dropdown populated based on field type
- Value input type changes based on operator (text, number, date picker, etc.)
- Add/remove buttons for clauses
- Drag-and-drop reordering (nice-to-have for MVP)

**Components:**
```
QueryBuilder
├── QueryNodeRow (one per clause)
│   ├── FieldSelector
│   ├── OperatorSelector (conditional on field type)
│   ├── ValueInput (conditional on operator)
│   ├── RemoveButton
│   └── AddChildButton (for bool queries)
└── AddQueryButton
```

**State Management:**
```typescript
// In context/QueryContext.tsx
interface QueryBuilderState {
  nodes: QueryNode[];        // Root-level clauses
  activeTab: 'query' | 'filter' | 'settings';
  resultPreview: SearchResult | null;
  isLoading: boolean;
  error: string | null;
}

// Actions
dispatch({ type: 'ADD_QUERY_NODE', payload: { type: 'match', ... } })
dispatch({ type: 'REMOVE_QUERY_NODE', payload: { nodeId: '...' } })
dispatch({ type: 'UPDATE_QUERY_NODE', payload: { nodeId: '...', changes: {...} } })
dispatch({ type: 'EXECUTE_QUERY', payload: {} })
```

#### 1.4 JSON DSL Editor
**What:** Real-time display of generated query JSON

**Features:**
- [x] Display generated OpenSearch DSL as formatted JSON
- [x] Read-only initially (Phase 2: make it editable for power users)
- [x] Syntax highlighting
- [x] Copy-to-clipboard button
- [x] Auto-format/beautify

**Implementation:**
- Monaco Editor in read-only mode
- Sync with query state in real-time
- Show validation errors if JSON is invalid

#### 1.5 Query Execution & Results
**What:** Send queries to OpenSearch and display results

**Features:**
- [x] Execute button (clear, prominent)
- [x] Display total hits
- [x] Show documents in table format (first 100 results)
- [x] Display query metadata (took, timed_out, _shards)
- [x] Error handling and error messages
- [x] Loading indicator during execution
- [x] Pagination (from/size parameters)

**Components:**
- `ExecuteButton` - Primary action button
- `ResultsPanel` - Tabbed view (hits, metadata, aggregations)
- `HitsTable` - Paginated results display
- `MetadataDisplay` - Query timing, shard info

**Query Execution Flow:**
1. Validate query structure
2. Serialize to OpenSearch DSL
3. Add size/from from pagination controls
4. POST to OpenSearch `/{index}/_search`
5. Display results or error

#### 1.6 Basic Settings Panel
**What:** Configure query-level settings

**Controls:**
- [x] Result size (10, 20, 50, 100)
- [x] From (pagination offset)
- [x] Timeout (ms)
- [x] Explain checkbox
- [x] Track scores checkbox

**Implementation:**
- Simple form with inputs
- Update QueryState on change
- Re-execute automatically (with debounce to avoid hammering OpenSearch)

### MVP Scope Definition
**In Scope:**
- Single-index queries
- Visual builder for 8 core query types
- Real-time JSON preview
- Query execution and results display
- Field mapping integration
- Basic settings
- Error handling

**Out of Scope (Phase 2+):**
- Multi-index queries
- Aggregations builder
- Code export
- Query templates
- Query history/saving
- Nested query full support
- Geo queries
- Script queries
- Full-text analyzers

### Deliverables
- ✅ Complete visual query builder UI
- ✅ Query state management system
- ✅ DSL serialization/deserialization logic
- ✅ OpenSearch integration (execute queries)
- ✅ Results display
- ✅ Basic unit tests (>70% coverage)
- ✅ Deployed demo instance
- ✅ User documentation (README)

### Success Criteria
- User can connect to OpenSearch cluster
- User can see available fields from index
- User can build a complex bool query visually
- User can execute query and see results
- JSON preview stays in sync with visual builder
- No crashes on edge cases
- Reasonable performance (<2s round trip for typical queries)

---

## Phase 2: Polish & Essential Features (4-6 weeks)

### Objectives
Make MVP production-ready and add critical missing features.

### 2.1 Query Templates & Presets
**What:** Pre-built queries for common use cases

**Examples:**
- "Find recent documents" (date range filter)
- "Full-text search" (match on text field)
- "Exact match" (term query)
- "Numeric range" (range query)

**Implementation:**
- Template gallery modal
- Click to load template
- Auto-populate with field suggestions

### 2.2 Code Export
**What:** Generate executable code snippets

**Target Languages:**
- Python (opensearchpy)
- JavaScript/Node.js (opensearch-js)
- cURL
- Java (optional)

**Features:**
- [x] Copy-to-clipboard for each snippet
- [x] Syntax highlighting for each language
- [x] Authentication options per language
- [x] Tab switcher between languages

### 2.3 Query History
**What:** Track recently executed queries

**Features:**
- [x] Sidebar showing last 20 queries
- [x] Timestamp and result count
- [x] Click to restore query
- [x] Clear history button
- [x] Optional: Export history to file

### 2.4 Aggregations Builder (Basic)
**What:** Support for simple aggregations

**Supported Agg Types:**
- Terms aggregation
- Range aggregation
- Avg/Min/Max aggregation
- Histogram

**UI:**
- Separate tab: "Aggregations"
- Table showing defined aggregations
- Add/remove buttons
- Configure bucket size, field, etc.

### 2.5 Advanced Query Options
**What:** Additional DSL parameters

**Parameters to Support:**
- min_score
- boost
- _name (for debugging)
- ignore_unavailable
- allow_no_indices
- analyzer selection per field
- fuzziness for match queries

### 2.6 Validation & Error Messages
**What:** Better error handling and UX

**Improvements:**
- [x] Validate query structure before execution
- [x] Show field type mismatch warnings
- [x] Explain why operator isn't available for field type
- [x] Better error messages from OpenSearch
- [x] Inline validation on form inputs

### 2.7 Improved UX
**What:** Quality-of-life improvements

- [x] Keyboard shortcuts (Cmd/Ctrl+Enter to execute)
- [x] Dark mode support
- [x] Responsive design (mobile-friendly)
- [x] Better visual hierarchy
- [x] Inline help/tooltips
- [x] Quick-select recent fields
- [x] Copy query ID/name

### 2.8 Testing & Documentation
**What:** Comprehensive test coverage and docs

- [x] Unit tests for DSL builders (>80% coverage)
- [x] Integration tests for OpenSearch execution
- [x] E2E tests for critical workflows
- [x] User guide (markdown, with screenshots)
- [x] API documentation for internal modules
- [x] Troubleshooting guide

### Deliverables
- ✅ Query templates system
- ✅ Code export functionality
- ✅ Query history
- ✅ Aggregations builder (basic)
- ✅ Advanced options panel
- ✅ Improved error handling
- ✅ Dark mode
- ✅ Comprehensive test suite
- ✅ Full documentation

---

## Phase 3: Advanced Features (4-6 weeks)

### 3.1 Saved Queries & Collections
- Create named query collections
- Organize queries into folders
- Share query URLs

### 3.2 Advanced Query Types
- Geo queries (geo_distance, geo_bounding_box)
- Script queries
- Span queries
- More complex nested scenarios

### 3.3 Query Debugging & Analysis
- Explain endpoint integration (show scoring breakdown)
- Profile endpoint (show timing per section)
- Query visualization (show query plan)

### 3.4 Import/Export
- Export queries as JSON
- Import queries from JSON
- Export results to CSV

### 3.5 Collaboration Features (Optional)
- Share query links
- Comments/annotations on queries
- Basic audit trail

---

## Phase 4: Production & Deployment (2-3 weeks)

### 4.1 Security
- Remove hardcoded credentials from UI
- Implement secure credential storage
- Add RBAC if multi-user
- Security headers

### 4.2 Performance
- Query optimization
- Caching strategy
- Load testing
- Optimize bundle size

### 4.3 Deployment Options
- Vercel deployment (free tier)
- Docker container for self-hosted
- OpenSearch Dashboards plugin (optional)

### 4.4 Monitoring & Analytics
- Error tracking (Sentry)
- Usage analytics
- Performance monitoring

---

## Development Workflow

### Tools & Commands
```bash
# Setup
npm install
npm run dev              # Start dev server on localhost:3000

# Development
npm run dev              # Hot reload
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # Linting
npm run type-check       # TypeScript check

# Build
npm run build            # Production build
npm run start            # Production start

# Code quality
npm run format           # Prettier format
npm run storybook        # Component library
```

### Git Workflow
- Branch per feature: `feature/query-builder`, `feature/code-export`, etc.
- Commit messages: `feat: add match query support`, `fix: null handling in range query`
- PR reviews before merge to main
- Automated tests on PR

### Code Organization Principles
1. **Single Responsibility** - Each component does one thing
2. **Type Safety** - Full TypeScript, no `any`
3. **Testability** - Logic separated from UI
4. **Reusability** - Extract common patterns
5. **Documentation** - JSDoc for complex functions

---

## Key Technical Decisions & Rationale

### 1. Why Next.js 15?
- ✅ Built-in API routes (optional backend later)
- ✅ Excellent TypeScript support
- ✅ App Router (modern, flexible)
- ✅ Server components for optimization
- ✅ Easy deployment to Vercel

### 2. Why React Context over Redux?
- ✅ Query builder state is localized (single component tree)
- ✅ Redux adds complexity not needed for MVP
- ✅ Easy to add Redux later if needed
- ✅ Smaller bundle size

### 3. Why Not Monorepo Initially?
- Keep it simple for MVP
- Move to monorepo (Turborepo/Nx) in Phase 2 if needed
- Can split query-dsl into separate package later

### 4. Why OpenSearch API Calls from Frontend?
- MVP only: No auth complexity
- Phase 4: Move to backend proxy for security
- For now: Connect directly from browser (with CORS enabled on OpenSearch)

### 5. Query State Serialization Strategy
```typescript
// State (canonical)
const state = {
  query: {
    type: 'bool',
    must: [
      { type: 'match', field: 'title', value: 'opensearch' }
    ]
  }
}

// Serialize to DSL
const dsl = serializeQuery(state);
// Output: {"bool":{"must":[{"match":{"title":"opensearch"}}]}}

// Deserialize from DSL
const restored = deserializeQuery(dsl);
// Output: same as state
```

---

## Success Metrics

### Phase 1 (MVP)
- Can build 5 different query types visually
- No syntax errors in generated JSON
- Query execution works 99% of the time
- Sub-2s latency for typical queries
- <5% error rate

### Phase 2 (Polish)
- 80%+ test coverage
- Code export works for 3 languages
- Query templates cover 90% of use cases
- Full documentation
- <1% error rate

### Overall (Production)
- 100+ GitHub stars
- >50 monthly active users (if publicly released)
- <0.5% error rate in production
- <1s p95 latency
- 99.9% uptime

---

## Known Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| OpenSearch DSL is complex (100+ query types) | High | Start with 8 core types in MVP, iterate |
| Field type inference errors | Medium | Comprehensive test coverage, clear error messages |
| Performance with large indices | Medium | Implement caching, limit schema fetch |
| CORS issues with OpenSearch | Medium | Document setup, provide Docker compose example |
| Users want features not in roadmap | Low | Maintain backlog, prioritize by demand |

---

## File Structure for Phase 1

```
opensearch-query-builder/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main app page
│   ├── api/
│   │   └── opensearch/
│   │       ├── execute/        # Query execution endpoint
│   │       ├── schema/         # Fetch index schema
│   │       └── connect/        # Validate connection
│   └── globals.css
├── components/
│   ├── QueryBuilder/
│   │   ├── QueryBuilder.tsx
│   │   ├── QueryNode.tsx
│   │   ├── BooleanGroup.tsx
│   │   └── OperatorSelector.tsx
│   ├── ConnectionModal.tsx
│   ├── JSONPreview.tsx
│   ├── ResultsPanel.tsx
│   ├── FieldList.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Select.tsx
├── context/
│   ├── QueryContext.tsx        # Query state management
│   ├── ConnectionContext.tsx   # Connection state
│   └── useQueryBuilder.ts      # Custom hook
├── lib/
│   ├── opensearch/
│   │   ├── client.ts           # OpenSearch API wrapper
│   │   ├── query-executor.ts   # Execute queries
│   │   └── schema-parser.ts    # Parse mappings
│   ├── dsl/
│   │   ├── serializer.ts       # State → DSL JSON
│   │   ├── deserializer.ts     # DSL JSON → State
│   │   ├── validators.ts       # DSL validation
│   │   └── operators.ts        # Operator definitions per type
│   └── types.ts                # TypeScript interfaces
├── hooks/
│   ├── useQueryExecution.ts
│   ├── useConnectionForm.ts
│   └── useFieldSelector.ts
├── styles/
│   └── tailwind.config.ts
├── __tests__/
│   ├── lib/dsl/
│   ├── components/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## Next Steps (For Agent to Execute)

1. **Phase 0, Week 1:**
   - [ ] Initialize Next.js 15 project with TypeScript
   - [ ] Set up Tailwind + shadcn/ui
   - [ ] Create project structure from above
   - [ ] Set up git repository
   - [ ] Create `.env.example` with OpenSearch connection variables
   - [ ] Install dependencies: `typescript`, `react`, `tailwindcss`, `axios`, `react-hook-form`, `monaco-editor`
   - [ ] Set up ESLint + Prettier
   - [ ] Create initial layout component
   - [ ] Document architecture decisions in ARCHITECTURE.md

2. **Phase 0, Week 2:**
   - [ ] Test OpenSearch client connectivity
   - [ ] Create QueryContext and types
   - [ ] Build ConnectionModal component
   - [ ] Implement basic schema fetching
   - [ ] Create initial FieldList component
   - [ ] Write tests for DSL types

3. **Phase 1, Weeks 1-2:**
   - [ ] Build QueryBuilder component structure
   - [ ] Implement state management (add/remove/update nodes)
   - [ ] Create QueryNode component
   - [ ] Build OperatorSelector
   - [ ] Build value input components (text, number, date)

4. **Phase 1, Weeks 3-4:**
   - [ ] Implement DSL serializer
   - [ ] Create JSONPreview component
   - [ ] Build field type → operator mapping
   - [ ] Write comprehensive tests

5. **Phase 1, Weeks 5-6:**
   - [ ] Build query execution logic
   - [ ] Create ResultsPanel
   - [ ] Implement pagination
   - [ ] Add error handling
   - [ ] Integration testing

6. **Phase 1, Weeks 7-8:**
   - [ ] Polish UI
   - [ ] Performance optimization
   - [ ] Documentation
   - [ ] Deploy to Vercel
   - [ ] Create demo video/screenshots

---

## Decision Log

**When to add entries to this section as development progresses**

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-01-01 | Next.js 15 + TypeScript | Modern, type-safe, easy deployment | Faster dev, fewer bugs |
| 2025-01-01 | React Context over Redux | Simpler, sufficient for MVP | Smaller bundle, less boilerplate |
| --- | --- | --- | --- |

---

## Resources & References

### OpenSearch Documentation
- [Query DSL Guide](https://opensearch.org/docs/latest/query-dsl/)
- [Mappings Guide](https://opensearch.org/docs/latest/field-types/)
- [JavaScript Client](https://github.com/opensearch-project/opensearch-js)

### Similar Tools (for reference/inspiration)
- [Mirage](https://github.com/appbaseio/mirage) - Blocks-based query builder
- [Kibana Dev Tools](https://www.elastic.co/guide/en/kibana/current/console-kibana.html) - REST console
- [Postman](https://www.postman.com/) - API client

### Technologies
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

## Contact & Collaboration

**Project Lead:** Kevin (OpenSearch expertise, Gartner background)
**Repository:** [Will be created]
**Issues & PRs:** Follow standard GitHub workflow

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-01  
**Status:** Ready for Phase 0 execution
