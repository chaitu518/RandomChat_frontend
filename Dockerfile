# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
# Unprivileged nginx image for better security defaults
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

# Runtime nginx template + entrypoint (PORT + env.js injection)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

# Copy static build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose unprivileged nginx port
EXPOSE 3000

# Basic healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:3000/" || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
