# Crystal Forge Web Application

Visual query builder UI for OpenSearch. Build complex queries without writing JSON DSL manually.

## Quick Start

### Prerequisites
- Node.js 18+
- npm 10+
- OpenSearch 3.0+ (local or remote)

### Local Development

1. **Install dependencies** (from repo root):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your OpenSearch connection details
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000)

4. **Connect to OpenSearch**:
   - Click "Connect to OpenSearch" on the page
   - Enter your cluster URL, username, and password
   - Select an index to start building queries

### Docker Setup (Recommended)

Complete environment with OpenSearch, Dashboards, and sample data:

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Services:
- **Crystal Forge**: http://localhost:3000
- **OpenSearch**: http://localhost:9200
- **Dashboards**: http://localhost:5601
- **Sample Data**: Auto-loaded into `opensearch-demo` index

See parent [docker-compose.yml](/docker-compose.yml) for configuration.

## Development

### Project Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main entry point
│   ├── layout.tsx                # Root layout
│   ├── error.tsx                 # Error boundary
│   └── api/opensearch/           # API routes to OpenSearch
├── components/                   # React components
│   ├── QueryBuilder/             # Main query building interface
│   ├── ResultsPanel/             # Query results display
│   ├── FieldList/                # Available fields sidebar
│   ├── JSONPreview/              # Query DSL editor
│   ├── ConnectionModal/          # OpenSearch connection setup
│   ├── HelpMenu/                 # Help and documentation
│   ├── TemplateLibrary/          # Saved queries and history
│   ├── DatePickers/              # Date input components
│   └── ui/                       # shadcn/ui components
├── context/                      # React Context providers
│   ├── QueryContext.tsx          # Query state management
│   ├── ConnectionContext.tsx     # OpenSearch connection state
│   ├── TemplateContext.tsx       # Template library state
│   └── ActiveClauseContext.tsx   # Active bool clause tracking
├── hooks/                        # Custom React hooks
│   ├── useQuery.ts               # Query state access
│   ├── useConnection.ts          # Connection state access
│   ├── useQueryExecution.ts      # Execute queries
│   ├── useQueryPersistence.ts    # Auto-save queries to IndexedDB
│   └── ...
├── lib/                          # Utility functions
│   ├── opensearch-schema.ts      # OpenSearch query JSON schema
│   ├── monaco-completions.ts     # Code editor autocomplete
│   ├── docker-host.ts            # Docker environment handling
│   ├── logger.ts                 # Structured logging
│   └── utils.ts                  # General utilities
├── constants/                    # Constants and configurations
│   ├── example-queries.ts        # Example queries for empty state
│   ├── tour-steps.ts             # Onboarding tour steps
│   └── tooltips.ts               # UI tooltips
└── public/                       # Static assets
    └── favicon.svg

```

### Available Scripts

```bash
# From repo root
npm run dev              # Start development server
npm run build            # Production build
npm run start            # Run production server
npm run lint             # Lint all code
npm run format           # Format with Prettier
npm run test             # Run tests
npm run test -- --watch  # Run tests in watch mode

# From apps/web directory
cd apps/web
npm run test -- --watch  # Watch mode for this app only
```

### Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript 5+** - Type-safe JavaScript
- **React Context** - State management
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Accessible UI components
- **Monaco Editor** - OpenSearch DSL editor
- **Vitest** - Unit testing

## Architecture

### State Management

Query building state flows through three main contexts:

1. **ConnectionContext** - OpenSearch connection and schema
2. **QueryContext** - The visual query being built (QueryNode tree)
3. **TemplateContext** - Saved queries and execution history

Updates automatically persist to browser IndexedDB.

### Query Building Flow

```
User builds query visually
         ↓
QueryContext state updates
         ↓
serializeQueryState() converts to OpenSearch DSL
         ↓
API route sends to OpenSearch
         ↓
Results stored in QueryContext
         ↓
ResultsPanel displays results
```

### API Routes

All routes proxy to OpenSearch through `OPENSEARCH_HOST`:

- `POST /api/opensearch/connect` - Validate connection and list indices
- `GET /api/opensearch/schema` - Get index field mappings
- `POST /api/opensearch/execute` - Execute query with aggregations
- `POST /api/opensearch/aggregate` - Execute aggregations only

See [API Route Documentation](./app/api/opensearch/README.md) for details.

## Debugging

### Enable Development Logging

Structured logs are output to console. In production, configure an error tracking service:

```typescript
// lib/logger.ts
export const logger = {
  error: (msg: string, err?: Error) => {
    console.error(JSON.stringify({ level: 'error', msg, err: err?.message }));
    // Send to Sentry, LogRocket, etc. in production
  },
};
```

### React DevTools

Chrome extension [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/) is recommended for:
- Component tree inspection
- Props/state debugging
- Profiling rendering performance

### Monaco Editor Issues

If the JSON editor isn't showing:
- Check browser console for errors
- Ensure `apps/web/.next/` directory exists (build artifact)
- Clear browser cache: `Cmd+Shift+Delete` (macOS) or `Ctrl+Shift+Delete` (Windows)

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### Test Structure

Test files follow the pattern `[component].test.ts(x)`:

```
QueryBuilder/
├── QueryBuilder.tsx
└── QueryBuilder.test.tsx
```

## Performance Tips

### Large Datasets
- Use "filter" clauses instead of "must" when possible (faster, doesn't score)
- Limit aggregation size (use "size" parameter)
- Test range queries on date fields (more efficient)

### Slow Queries
- Check aggregation query complexity
- Review OpenSearch cluster health
- Use OpenSearch Dashboards Dev Tools to analyze slow queries

## Accessibility

Crystal Forge follows **WCAG 2.1 Level AA** standards:

### Keyboard Navigation
- `Ctrl+Enter` - Execute query
- `Tab/Shift+Tab` - Navigate elements
- `Escape` - Close modals
- `Arrow Keys` - Resize panels

### Screen Reader Support
- All interactive elements have labels
- Live regions announce status changes
- Semantic HTML structure

### Testing
- Run [axe DevTools](https://www.deque.com/axe/devtools/) browser extension
- Lighthouse accessibility audit: `npm run build && lighthouse http://localhost:3000 --view`

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
OPENSEARCH_HOST=https://your-opensearch-cluster.com:9200
OPENSEARCH_USERNAME=production-user
OPENSEARCH_PASSWORD=production-password
# Note: Never commit credentials to git
```

### Security

- **Credentials**: Use environment secrets, not git
- **CORS**: Configure OpenSearch to accept requests from your domain
- **HTTPS**: Always use HTTPS in production
- **Authentication**: Consider OAuth/OIDC for multi-user deployments

### Monitoring

Before going live, set up:

1. **Error Tracking** - Sentry, LogRocket, or equivalent
2. **Performance Monitoring** - Web Vitals, synthetic tests
3. **Usage Analytics** - Understand query patterns
4. **Logs** - Centralized logging (CloudWatch, ELK, etc.)

## Troubleshooting

### Connection Fails
- Check OpenSearch is running: `curl -k https://localhost:9200`
- Verify credentials in `.env.local`
- Check network connectivity
- Review OpenSearch error logs

### Queries Not Executing
- Check browser console for errors
- Verify index exists: open OpenSearch Dashboards
- Check OpenSearch cluster health: `curl -k https://localhost:9200/_cluster/health`

### Slow Performance
- Profile with React DevTools Profiler
- Check bundle size: `npm run build` outputs size report
- Monitor API response times in browser DevTools Network tab

## Contributing

See parent [CLAUDE.md](/CLAUDE.md) for contribution guidelines and architecture decisions.

## Resources

- [OpenSearch Query DSL Documentation](https://opensearch.org/docs/latest/query-dsl/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

See parent [LICENSE](../../LICENSE) file.
