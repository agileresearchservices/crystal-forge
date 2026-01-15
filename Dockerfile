# Stage 1: Base - Alpine Node.js with libc compatibility
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g npm@11.7.0
WORKDIR /app

# Stage 2: Dependencies - Install all dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/query-dsl/package.json ./packages/query-dsl/
COPY packages/query-validator/package.json ./packages/query-validator/
COPY packages/opensearch-client/package.json ./packages/opensearch-client/
COPY packages/storage/package.json ./packages/storage/
RUN npm ci

# Stage 3: Builder - Build all packages and Next.js app
FROM base AS builder
WORKDIR /app
# Copy all node_modules (root + packages) from deps stage
COPY --from=deps /app/ ./
# Copy source code
COPY . .
# Ensure public folder exists (may not exist in some projects)
RUN mkdir -p apps/web/public
RUN npm run build

# Stage 5: Runner - Minimal production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js standalone server
CMD ["node", "apps/web/server.js"]
