# Crystal Forge

A visual query builder UI for OpenSearch that enables users to construct complex queries without writing JSON DSL manually.

![Crystal Forge Screenshot](docs/screenshot.png)

## Features

- **Visual Query Builder** - Build bool queries with must/should/must_not/filter clauses
- **Field Browser** - Browse index fields with type information
- **Live JSON Preview** - See the generated OpenSearch DSL in real-time
- **Query Execution** - Run queries directly and view results
- **Multiple Query Types** - Support for match, term, range, prefix, wildcard, exists, and more

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Code Editor:** Monaco Editor
- **Build System:** Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- OpenSearch cluster (local or remote)

### Installation

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
├── apps/web/                     # Next.js frontend
│   ├── app/                      # App router pages & API routes
│   ├── components/               # React components
│   ├── context/                  # React Context providers
│   └── hooks/                    # Custom hooks
├── packages/
│   ├── query-dsl/                # Query types & serialization
│   ├── query-validator/          # Query validation
│   └── opensearch-client/        # OpenSearch API client
```

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build all packages and app
npm run lint         # Lint all code
npm run test         # Run tests
npm run format       # Format code with Prettier
```

## License

MIT
