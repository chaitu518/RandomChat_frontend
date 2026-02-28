#!/bin/sh
set -eu

if [ -z "${VITE_WS_BROKER_URL:-}" ]; then
  echo "Error: VITE_WS_BROKER_URL is required at runtime." >&2
  exit 1
fi

BROKER_URL_ESCAPED=$(printf '%s' "$VITE_WS_BROKER_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat <<EOF > /tmp/env.js
window.__APP_CONFIG__ = {
  VITE_WS_BROKER_URL: "${BROKER_URL_ESCAPED}"
};
EOF

echo "Runtime config generated: /tmp/env.js"
