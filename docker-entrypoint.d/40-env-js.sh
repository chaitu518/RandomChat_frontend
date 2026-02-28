#!/bin/sh
set -eu

PORT="${PORT:-3000}"

BROKER_URL="${VITE_WS_BROKER_URL:-}"
if [ -z "$BROKER_URL" ]; then
  echo "Warning: VITE_WS_BROKER_URL is not set at runtime." >&2
fi
BROKER_URL_ESCAPED=$(printf '%s' "$BROKER_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

# Generate runtime config
cat <<EOF > /usr/share/nginx/html/env.js
window.__APP_CONFIG__ = {
  VITE_WS_BROKER_URL: "${BROKER_URL_ESCAPED}"
};
EOF
echo "Runtime config generated: /usr/share/nginx/html/env.js"

# Generate full nginx config directly (avoids envsubst breaking nginx \$uri etc)
cat > /etc/nginx/conf.d/default.conf <<NGINX
server {
  listen ${PORT};
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript image/svg+xml;
  gzip_min_length 1024;

  location ~* \.(?:css|js|mjs|woff2?|ttf|svg|ico|png|jpg|gif|webp)\$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
    try_files \$uri =404;
  }

  location = /env.js {
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    expires -1;
    try_files \$uri =404;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
NGINX
echo "Nginx config generated for port ${PORT}"
