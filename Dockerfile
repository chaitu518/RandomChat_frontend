# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_WS_BROKER_URL
ENV VITE_WS_BROKER_URL=${VITE_WS_BROKER_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.29-alpine AS runtime

# Copy static build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Write nginx config directly at build time — no entrypoint scripts, no envsubst surprises
RUN printf 'server {\n\
  listen 3000;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  add_header X-Frame-Options "SAMEORIGIN" always;\n\
  add_header X-Content-Type-Options "nosniff" always;\n\
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript image/svg+xml;\n\
\n\
  location ~* \\.(?:css|js|mjs|woff2?|ttf|svg|ico|png|jpg|gif|webp)$ {\n\
    expires 30d;\n\
    add_header Cache-Control "public, max-age=2592000, immutable";\n\
    try_files $uri =404;\n\
  }\n\
\n\
  location = /env.js {\n\
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;\n\
    expires -1;\n\
    try_files $uri =404;\n\
  }\n\
\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
