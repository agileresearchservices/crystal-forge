# Crystal Forge

A visual query builder UI for OpenSearch that enables users to construct complex queries without writing JSON DSL manually.

![Crystal Forge Screenshot](docs/screenshot.png)

## Features

### Core Query Building
- **Visual Query Builder** - Build bool queries with must/should/must_not/filter clauses using intuitive UI
- **Multiple Query Types** - Support for 26+ query types including match, term, range, prefix, wildcard, exists, nested, geo_distance, and more
- **Smart Field Mapping** - Automatically selects appropriate query type based on field type (text→match, keyword→term, numeric→range)
- **Field Browser** - Browse and search index fields with type information
- **Drag-and-Drop** - Add fields to query clauses by dragging from the sidebar

### Code Editor & Authoring
- **Monaco Editor Integration** - Advanced code editor with syntax highlighting and IntelliSense
- **Context-Aware Autocomplete** - Intelligent suggestions for query types, aggregation types, and properties
- **JSON Schema Validation** - Real-time validation with visual error indicators
- **Dev Tools Format Support** - Copy queries in OpenSearch Dashboards format (`GET {index}/_search`)
- **Bidirectional Sync** - Edit in visual builder or JSON, changes sync automatically
- **Dark Mode** - Full dark mode support with automatic theme detection

### Query Patterns & Templates
- **18 Built-in Templates** - Pre-configured query patterns for Common, E-commerce, and Advanced use cases
- **Query History** - Automatic tracking of recent queries (up to 50 entries) with one-click reload
- **Save as Template** - Save current query for reuse with categories and tags
- **Search & Filter** - Find templates by name, category, or tags
- **Duplicate Templates** - Clone existing templates to customize

### Aggregations & Analysis
- **Visual Aggregation Builder** - Build 11 types of aggregations without writing JSON
- **Aggregation Types** - Terms, Stats, Extended Stats, Date Histogram, Histogram, Range, Cardinality, Avg, Sum, Min, Max, Value Count
- **Type-Specific Parameters** - Dynamic forms for configuring aggregation-specific options
- **Field Exploration** - Auto-generated aggregations to preview field values
- **Aggregation Templates** - Reusable aggregation patterns for common scenarios

### Execution & Results
- **Live JSON Preview** - See the generated OpenSearch DSL in real-time
- **Query Execution** - Run queries directly and view results in a paginated table
- **Result Inspection** - View detailed result data with syntax highlighting
- **Responsive Panels** - Resizable panels for optimal workspace layout on any screen size

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Code Editor:** Monaco Editor
- **Build System:** Turborepo

## Getting Started

### Quick Start with Docker (Recommended)

The fastest way to try Crystal Forge with a fully configured OpenSearch environment:

```bash
# Clone the repository
git clone https://github.com/yourusername/crystal-forge.git
cd crystal-forge

# Start all services (interactive with status feedback)
./docker/scripts/setup.sh

# Or use docker compose directly
docker compose up -d
```

This starts:
- **Crystal Forge** on port 3000
- **OpenSearch** on port 9200 (no authentication)
- **OpenSearch Dashboards** on port 5601
- **Sample data** - 1000 documents across 4 domains (e-commerce, technical docs, blog articles, user reviews)

Connect to `http://localhost:9200` and select the `opensearch-demo` index to start exploring.

### Stopping the Environment

```bash
# Stop containers (preserves data for fast restart)
./docker/scripts/teardown.sh

# Full cleanup (removes volumes and generated data)
./docker/scripts/teardown.sh --clean
```

### Local Development

#### Prerequisites

- Node.js 18+
- npm 10+
- OpenSearch cluster (local or remote)

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/crystal-forge.git
cd crystal-forge

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Connecting to OpenSearch

1. Click the **Connect** button in the header
2. Enter your OpenSearch host URL (e.g., `http://localhost:9200`)
3. Select authentication method (None, Basic, API Key, or AWS SigV4)
4. Click **Connect**
5. Select an index from the dropdown

## Project Structure

```
crystal-forge/
├── apps/web/                     # Next.js 15 frontend
│   ├── app/                      # App router pages & API routes
│   ├── components/
│   │   ├── QueryBuilder/         # Visual query builder
│   │   ├── TemplateLibrary/      # Template library UI
│   │   ├── AggregationsBuilder/  # Visual aggregation builder
│   │   ├── AggregationsPanel/    # Explore & build aggregations
│   │   ├── JSONPreview/          # Monaco editor with schema & completions
│   │   └── ui/                   # shadcn/ui components
│   ├── context/                  # React Context providers
│   │   ├── QueryContext/         # Query state management
│   │   ├── TemplateContext/      # Template & history state
│   │   └── ConnectionContext/    # OpenSearch connection state
│   ├── lib/                      # Utilities & config
│   │   ├── opensearch-schema.ts  # OpenSearch DSL JSON schema
│   │   └── monaco-completions.ts # Monaco autocomplete provider
│   └── hooks/                    # Custom hooks
├── packages/
│   ├── query-dsl/                # Query types & serialization
│   ├── query-validator/          # Query validation
│   ├── opensearch-client/        # OpenSearch API client
│   └── storage/                  # IndexedDB storage for templates
├── docker/
│   └── scripts/                  # Python scripts for data generation
│       ├── data_generator.py     # Generates 1000 sample documents
│       ├── bulk_loader.py        # Loads data into OpenSearch
│       └── index_mappings.json   # Custom analyzers & field mappings
├── Dockerfile                    # Multi-stage build for Next.js
└── docker-compose.yml            # Full stack: UI + OpenSearch + Dashboards
```

## Why Crystal Forge?

### Competitive Advantages

Crystal Forge fills a genuine gap in the OpenSearch ecosystem. While tools like Mirage, Kibana Dev Tools, and Postman exist, none are actively maintained, modern, and OpenSearch-focused.

**Existing Tools Comparison:**

| Feature | Crystal Forge | Mirage | Kibana | Postman |
| --- | --- | --- | --- | --- |
| **Visual Query Builder** | ✅ Full | ⚠️ Partial | ⚠️ Basic | ❌ No |
| **OpenSearch Focused** | ✅ Yes | ❌ ES only (2019) | ✅ Yes | ❌ Generic REST |
| **Web-Based** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Modern Stack** | ✅ Next.js 15 | ❌ Angular 2 | ⚠️ Proprietary | ⚠️ Proprietary |
| **Query Execution** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Aggregations** | ✅ Yes | ❌ No | ⚠️ Limited | ❌ No |
| **Code Export** | ✅ Yes (planned) | ❌ No | ⚠️ Limited | ✅ Yes |
| **Actively Maintained** | ✅ Yes | ❌ No (2019) | ✅ Yes | ✅ Yes |

### Key Strengths

1. **Modern Architecture** - Built with Next.js 15, TypeScript, React 18, and Tailwind CSS
2. **OpenSearch-First** - Deep OpenSearch knowledge, not an Elasticsearch port
3. **Complete DSL Coverage** - 26+ query types covering 95%+ of real-world use cases
4. **Accessibility Excellence** - **100/100 Lighthouse accessibility score** with full WCAG 2.1 Level AA compliance
   - Full keyboard navigation support (Tab, Arrow keys, Escape)
   - Screen reader compatible with proper ARIA labels
   - 4.5:1+ color contrast ratio on all text
   - 44x44px minimum touch targets on mobile
   - Resizable panels with keyboard support
5. **Responsive Design** - Works on desktop and mobile with drag-and-drop, resizable panels
6. **Developer Experience** - Bidirectional JSON/visual sync, field exploration, real-time validation
7. **Open Source** - MIT licensed, community-driven development

## Development

```bash
# Local development
npm run dev          # Start dev server
npm run build        # Build all packages and app
npm run lint         # Lint all code
npm run test         # Run tests
npm run format       # Format code with Prettier

# Docker
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs -f        # View logs
docker compose up --build     # Rebuild and start

# Docker scripts (alternative)
./docker/scripts/setup.sh             # Interactive setup with status
./docker/scripts/setup.sh --build     # Force rebuild images
./docker/scripts/teardown.sh          # Stop containers (keep data)
./docker/scripts/teardown.sh --clean  # Full cleanup including volumes
```

## License

MIT
