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

# Copy static build output with unprivileged ownership
COPY --chown=101:0 --from=builder /app/dist /usr/share/nginx/html

# Expose unprivileged nginx port
EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
