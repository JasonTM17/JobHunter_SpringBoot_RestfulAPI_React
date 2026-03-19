# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_STORAGE_BASE_URL
ARG INTERNAL_API_BASE_URL
ARG INTERNAL_STORAGE_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8080}
ENV NEXT_PUBLIC_STORAGE_BASE_URL=${NEXT_PUBLIC_STORAGE_BASE_URL:-http://localhost:8080}
ENV INTERNAL_API_BASE_URL=${INTERNAL_API_BASE_URL:-http://backend:8080}
ENV INTERNAL_STORAGE_BASE_URL=${INTERNAL_STORAGE_BASE_URL:-http://backend:8080}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
    CMD wget -qO- "http://localhost:${PORT}/" > /dev/null || exit 1

CMD ["npm", "run", "start"]
