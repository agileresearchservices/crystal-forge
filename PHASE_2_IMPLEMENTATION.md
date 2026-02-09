# Phase 2 Implementation Guide

## Overview
Phase 2 focuses on testing infrastructure, performance optimization, and error tracking. Estimated effort: 10-12 hours spread across 2 weeks.

## 1. Test Suite Setup (6-8 hours)

### Status: ✅ Scaffolding Created
- `apps/web/hooks/useQuery.test.ts` - Example test suite with comprehensive coverage patterns

### What's Been Done
- Created Vitest configuration-ready test file
- Demonstrated testing patterns for:
  - Hook initialization
  - State management (setQuery, resetQuery)
  - Node operations (add, remove, update)
  - Nested queries
  - Aggregations

### Next Steps
1. **Install dependencies:**
   ```bash
   cd apps/web
   npm install --save-dev @testing-library/react @testing-library/jest-dom vitest @vitest/ui
   ```

2. **Create vitest.config.ts:**
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: [],
     },
   })
   ```

3. **Add to package.json:**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

4. **Create additional test files for:**
   - Context providers (QueryContext, ConnectionContext)
   - Custom hooks (useQueryExecution, useConnectionPersistence)
   - API routes
   - Component rendering

### Target Coverage: 20-30% this phase, 40-50% by Phase 3

---

## 2. Bundle Size Monitoring (1 hour)

### Status: ✅ Configuration Ready
- `apps/web/next.config.bundle-analyzer.ts` - Ready to integrate

### What's Been Done
- Created Next.js bundle analyzer configuration

### Next Steps
1. **Integrate into next.config.js:**
   ```bash
   cd apps/web
   npm install --save-dev @next/bundle-analyzer
   ```

2. **Update next.config.ts:**
   ```typescript
   import { analyzeBundle } from './next.config.bundle-analyzer'

   export default analyzeBundle;
   ```

3. **Add npm script:**
   ```bash
   "build:analyze": "ANALYZE=true npm run build"
   ```

4. **Usage:**
   ```bash
   npm run build:analyze
   # Opens interactive HTML report of bundle contents
   ```

### What It Does
- Visualizes bundle composition
- Identifies bloated dependencies
- Tracks size trends
- Helps catch regressions

---

## 3. Performance Optimization

### ✅ Completed
- **Reduced JSON Editor Debounce:** 500ms → 300ms
  - Faster response when editing JSON
  - Still prevents excessive re-parsing
  - File: `apps/web/components/JSONPreview.tsx` line 213

### Benefits
- More responsive editing experience
- Users see validation errors faster
- Better perceived performance

---

## 4. Sentry Integration (2 hours)

### What's Ready
- Structured logging hooks in `lib/logger.ts`
- Error boundary configured to report
- Documentation in `PRODUCTION_READINESS.md`

### Implementation Steps

1. **Install Sentry:**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Configure in apps/web/app/layout.tsx:**
   ```typescript
   import * as Sentry from "@sentry/react";

   if (typeof window !== 'undefined') {
     Sentry.init({
       dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
       environment: process.env.NODE_ENV,
       tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
       integrations: [
         new Sentry.Replay({
           maskAllText: true,
           blockAllMedia: true,
         }),
       ],
     });
   }
   ```

3. **Enable in logger (lib/logger.ts):**
   ```typescript
   // Uncomment lines ~119-121
   if (window.Sentry && level === 'error') {
     window.Sentry.captureException(error);
   }
   ```

4. **Environment variables:**
   ```bash
   # .env.local (development - optional)
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

   # Production - set via CI/CD or deployment platform
   ```

5. **Test it:**
   ```typescript
   import { logger } from '@/lib/logger';

   logger.error('Test error', new Error('Testing Sentry integration'));
   // Check Sentry dashboard to see the error
   ```

---

## 5. CSRF Protection Integration (1 hour)

### What's Ready
- Utility functions in `lib/csrf-protection.ts`
- Pattern documentation
- Ready for integration

### Integration Pattern

1. **In API routes (e.g., execute/route.ts):**
   ```typescript
   import { validateCSRFToken } from '@/lib/csrf-protection';

   export async function POST(request: NextRequest) {
     // Validate CSRF token
     const csrfError = await validateCSRFToken(request);
     if (csrfError) return csrfError;

     // Continue with request handling...
   }
   ```

2. **Generate tokens on client:**
   ```typescript
   import { generateCSRFToken } from '@/lib/csrf-protection';

   const token = generateCSRFToken();
   // Store in session or state
   ```

3. **Send with requests:**
   ```typescript
   const response = await fetch('/api/opensearch/execute', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-csrf-token': token,
     },
     body: JSON.stringify(query),
   });
   ```

### Note
CSRF protection is **optional** in Crystal Forge due to stateless architecture, but recommended for defense-in-depth.

---

## 6. Implementation Checklist

### Week 1 (High Priority)
- [ ] Install test dependencies
- [ ] Create vitest.config.ts
- [ ] Add npm test scripts
- [ ] Run existing useQuery.test.ts
- [ ] Install @next/bundle-analyzer
- [ ] Integrate bundle analyzer
- [ ] Run `npm run build:analyze`

### Week 2 (Medium Priority)
- [ ] Install Sentry packages
- [ ] Integrate Sentry in layout.tsx
- [ ] Get Sentry DSN
- [ ] Test error capture
- [ ] Write 5-10 additional test files
- [ ] Integrate CSRF protection (optional)
- [ ] Document integration points

### Ongoing
- [ ] Add test cases for new features
- [ ] Monitor bundle size reports
- [ ] Review Sentry error dashboard
- [ ] Track test coverage trends

---

## 7. Key Metrics to Track

### Performance
- Bundle size: Target < 200KB (current: ~85KB ✅)
- Time to interactive: Target < 3s
- First contentful paint: Target < 1.5s

### Reliability
- Error rate: Target < 0.1% (track in Sentry)
- Test coverage: Phase 2 target 20-30%
- Unhandled promise rejections: Target 0

### Quality
- Lighthouse score: Target 95+ (currently 100 ✅)
- Core Web Vitals: All green

---

## 8. Commands Reference

```bash
# Testing
npm run test              # Run tests in watch mode
npm run test:ui          # Visual test runner
npm run test:coverage    # Generate coverage report

# Performance
npm run build:analyze    # Analyze bundle composition

# Deployment
docker compose up --build -d

# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Lint code
npm run format           # Format code
```

---

## 9. Files Modified/Created

### Phase 2 Additions
```
✅ NEW: apps/web/hooks/useQuery.test.ts
✅ NEW: apps/web/next.config.bundle-analyzer.ts
✅ NEW: apps/web/package.json.additions.txt (reference)
✅ MODIFIED: apps/web/components/JSONPreview.tsx (debounce 500→300ms)
```

### Already Available (Phase 1)
```
- apps/web/app/error.tsx
- apps/web/lib/logger.ts
- apps/web/lib/csrf-protection.ts
- apps/web/.env.example
- apps/web/README.md
```

---

## 10. Success Criteria

By end of Phase 2:
- ✅ Test infrastructure working (Vitest + Testing Library)
- ✅ Bundle analysis tool integrated and documented
- ✅ JSON editor more responsive (300ms debounce)
- ✅ Sentry error tracking functional
- ✅ 20-30% code test coverage (focus on hooks/context)
- ✅ CSRF protection integrated (or documented for later)
- ✅ No regressions in Lighthouse score
- ✅ All phases documented in PRODUCTION_READINESS.md

---

## 11. Timeline Estimate

| Task | Effort | When |
|------|--------|------|
| Test setup | 3 hours | Week 1 |
| Bundle analysis | 1 hour | Week 1 |
| Performance tune | 0.5 hours | Week 1 |
| Sentry integration | 2 hours | Week 2 |
| Write test suite | 3 hours | Week 2 |
| CSRF integration | 1 hour | Week 2 (optional) |
| **Total** | **10-11 hours** | **2 weeks** |

---

## 12. Next Phase Preview (Phase 3)

After Phase 2, Phase 3 will focus on:
- Comprehensive test coverage (40-50%)
- Monitoring dashboard setup
- Security audit
- Advanced features (query versioning, etc.)
- Production deployment

Estimated effort: 4-6 weeks
Target score: 9+/10

---

**Updated:** 2026-02-09
**Status:** Ready to implement
