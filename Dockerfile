# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app


ENV VITE_WS_BROKER_URL=${VITE_WS_BROKER_URL}

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
# Unprivileged nginx image for better security defaults
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

# Static runtime config on port 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose unprivileged nginx port
EXPOSE 3000

# Basic healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:3000/" || exit 1

CMD ["nginx", "-g", "daemon off;"]
