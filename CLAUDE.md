# CLAUDE.md

This file provides guidance to Claude Code when working with Crystal Forge. Use this as the starting point; refer to `.claude/agents/` and `.claude/knowledge/` for domain-specific details.

## Project Overview

Crystal Forge is a visual query builder UI for OpenSearch. Users construct complex queries visually without writing JSON DSL manually.

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
├── Dockerfile                    # Multi-stage build for Next.js
├── docker-compose.yml            # Full stack: UI + OpenSearch + Dashboards
├── package.json                  # Root workspace config
├── turbo.json                    # Turborepo pipeline config
├── tsconfig.json                 # Base TypeScript config
├── CLAUDE.md                      # This file (Tier 1 — constitution)
└── .claude/
    ├── agents/                    # Tier 2 — Specialist agents (5 files)
    └── knowledge/                 # Tier 3 — Knowledge base (11 files)
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

**Services:** crystal-forge (port 3000), opensearch (port 9200), opensearch-dashboards (port 5601), data-loader

**Sample Data:** Index `opensearch-demo` with 1000 documents (e-commerce, technical docs, blog articles, user reviews)

**Architecture:** Multi-stage Dockerfile (~200MB), Docker network translation (localhost → opensearch), health checks

**Key Files:** `Dockerfile`, `docker-compose.yml`, `docker/scripts/setup.sh`, `docker/scripts/teardown.sh`

## Agent Trigger Table

Route tasks to pre-primed specialist agents:

| Task Pattern | Files Touched | Agent |
|---|---|---|
| Add/modify query type | `packages/query-dsl/src/types.ts`, `serializer.ts`, `deserializer.ts` | `query-dsl` |
| Fix serialization/deserialization bug | `packages/query-dsl/src/serializer.ts` OR `deserializer.ts` | `query-dsl` |
| Add/modify aggregation type | `packages/query-dsl/src/types.ts`, `serializer.ts` | `query-dsl` |
| Modify OperatorSelector or operators | `packages/query-dsl/src/operators.ts`, `OperatorSelector.tsx` | `query-dsl` |
| Add/modify React Context | `apps/web/context/*.tsx` | `react-state` |
| Add/modify custom hook | `apps/web/hooks/*.ts` | `react-state` |
| Modify query tree structure | `apps/web/context/QueryContext.tsx` | `react-state` |
| Add/modify API route | `apps/web/app/api/opensearch/**` | `api-routes` |
| Modify OpenSearch client | `packages/opensearch-client/src/client.ts` | `api-routes` |
| Docker or connection issues | `apps/web/lib/docker-host.ts`, `ConnectionContext.tsx` | `api-routes` |
| Add/modify UI component | `apps/web/components/**/*.tsx` | `ui-components` |
| Fix dark mode styling | Any component with `dark:` classes | `ui-components` |
| Fix accessibility / ARIA | Any component with `aria-*`, `role=` | `ui-components` |
| Modify JSONPreview/Monaco editor | `apps/web/components/JSONPreview.tsx` | `ui-components` |
| Modify resizable panels | `apps/web/hooks/useResizablePanels.ts`, `page.tsx` | `ui-components` |
| Modify onboarding tour | `apps/web/components/Tour/`, `constants/tour-steps.ts` | `ui-components` |
| Modify template CRUD | `packages/storage/src/templates.ts` | `storage-indexeddb` |
| Modify query history | `packages/storage/src/history.ts` | `storage-indexeddb` |
| Modify IndexedDB schema | `packages/storage/src/db.ts` | `storage-indexeddb` |

## Absolute Rules

### TypeScript & Code Quality
- **Strict mode required:** All TypeScript files compiled with `strict: true`
- **Import types explicitly:** Use `import type { Foo }` for type imports
- **Export via index:** All package exports via `packages/*/src/index.ts`
- **No `any`:** Avoid `any` type; use specific types or generics

### React & Next.js
- **'use client' required:** ALL interactive components start with `'use client'` (forgetting causes hydration errors)
- **Context hooks throw if missing:** Hooks throw error if used outside provider
- **Modal pattern:** `{ isOpen: boolean; onClose: () => void }` — use shadcn Dialog
- **JSONPreview use next/dynamic:** `import dynamic from 'next/dynamic'` with `ssr: false`

### Accessibility (WCAG 2.1 AA)
- **Focus rings on all interactive elements:** `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`
- **ARIA labels for icon-only buttons:** `aria-label="Description"`
- **Live regions for announcements:** `role="status" aria-live="polite"` for updates; `role="alert"` for errors
- **Dark mode pairs:** Every `bg-white` MUST have `dark:bg-gray-900`; every `text-gray-900` MUST have `dark:text-gray-100`
- **Touch targets minimum 44x44px:** All clickable elements

### Dark Mode
- **Test both modes:** Manually toggle light/dark theme before commit
- **Color contrast 4.5:1+:** Verify in both light and dark modes
- **Recharts colors:** `#6366f1` (light), `#818cf8` (dark)

### Known Type Misalignment
- **query-validator intentionally simplified:** Does NOT align with query-dsl types by design — do NOT try to align them

### API Routes
- **Always call `translateHostForDocker()`:** Before creating OpenSearchClient
- **Always call `client.connect()`:** Before any other operation
- **Three-tier error handling:** OpenSearchClientError → statusCode; SyntaxError → 400; unknown → 500

## Package Quick Reference

| Package | Purpose | Import Path | Key Exports |
|---|---|---|---|
| `@crystal-forge/query-dsl` | Query types, serialization | `import { ... } from '@crystal-forge/query-dsl'` | `QueryNode`, `QueryState`, `serializeQuery()`, `deserializeQuery()`, `FIELD_TYPE_OPERATORS` |
| `@crystal-forge/query-validator` | Validation | `import { ... } from '@crystal-forge/query-validator'` | `validateQueryNode()`, `ValidationResult` |
| `@crystal-forge/opensearch-client` | OpenSearch API wrapper | `import { OpenSearchClient } from '@crystal-forge/opensearch-client'` | `OpenSearchClient`, `parseMapping()` |
| `@crystal-forge/storage` | IndexedDB | `import { initDB, ... } from '@crystal-forge/storage'` | `getAllTemplates()`, `addToHistory()`, `seedTemplates()` |

### Context Provider Stack Order
```tsx
<ThemeProvider>
  <ConnectionProvider>
    <QueryProvider>
      <ActiveClauseProvider>
        {children}
      </ActiveClauseProvider>
    </QueryProvider>
  </ConnectionProvider>
</ThemeProvider>
```

## Knowledge Base Index

Crystal Forge uses a three-tier documentation system. Tier 1 (this file) routes tasks to specialists:

**Tier 2 Specialist Agents** (`.claude/agents/`):
- `query-dsl.md` — Query types, serialization, operators, aggregations
- `react-state.md` — QueryContext, hooks, state management, tree operations
- `api-routes.md` — API routes, OpenSearch client, Docker translation, error handling
- `ui-components.md` — React components, accessibility, dark mode, Monaco editor, tour, panels
- `storage-indexeddb.md` — IndexedDB, templates, history, aggregations, seed data

**Tier 3 Knowledge Base** (`.claude/knowledge/`):
- `query-dsl-types.md` — All 26 query types with serialization format + gotchas
- `query-tree-operations.md` — NodePath, tree mutation, QueryContext actions (15 types)
- `field-type-operators.md` — 32 field types → operator mappings, smart defaults
- `aggregations.md` — 12 aggregation types, serialization, chart rendering
- `json-editor-sync.md` — Monaco setup, bidirectional sync, Dev Tools format
- `opensearch-api.md` — 4 API routes, error handling, Docker host pattern
- `storage-schema.md` — IndexedDB schema, 3 object stores, CRUD operations
- `accessibility-wcag.md` — WCAG AA patterns, focus rings, ARIA, dark mode
- `drag-drop-field-add.md` — DnD flow, ActiveClauseContext, createQueryNodeFromField
- `onboarding-tour.md` — driver.js config, 15 tour steps, localStorage key
- `localstorage-keys.md` — All 7 localStorage keys, format, lifecycle

## Git Workflow

- **Branch naming:** `feature/query-builder`, `fix/range-query-bug`
- **Commit format:** `feat: add match query support`, `fix: null handling in range query`
- **Small commits:** Logically grouped changes; easy to review and revert

## Environment Setup

Copy `.env.example` to `.env.local` in `apps/web/`:

```bash
OPENSEARCH_HOST=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
```

---

**Last Updated:** March 2026
**Framework:** Next.js 15 | **Testing:** Vitest + React Testing Library
**Guidance System:** Three-tier (Constitution → Agents → Knowledge Base)
