# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_WS_BROKER_URL
ENV VITE_WS_BROKER_URL=${VITE_WS_BROKER_URL}

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
# Nginx runtime image
FROM nginx:1.29-alpine AS runtime

# Startup script generates nginx config + env.js at runtime
COPY --chmod=755 docker-entrypoint.d/40-env-js.sh /docker-entrypoint.d/40-env-js.sh

# Copy static build output with unprivileged ownership
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose unprivileged nginx port
EXPOSE 3000
