# Backend Dockerfile - Node.js + Prisma
FROM node:20-alpine AS base

# Install OpenSSL for Prisma and su-exec for dropping privileges after volume setup
RUN apk add --no-cache openssl su-exec

WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --only=production

# ============================================
# Build Stage
# ============================================
FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# ============================================
# Production Stage
# ============================================
FROM base AS production

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma generated client and schema
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

# Copy application code
COPY --from=build /app/src ./src
COPY package.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Change ownership to non-root user
RUN chown -R appuser:nodejs /app \
  && chmod +x /usr/local/bin/docker-entrypoint.sh

USER root

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Prepare writable upload volume as root, then run the app as appuser
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
