#!/bin/sh
set -eu

BROKER_URL="${VITE_WS_BROKER_URL:-}"

if [ -z "$BROKER_URL" ]; then
  echo "Warning: VITE_WS_BROKER_URL is not set at runtime." >&2
fi

BROKER_URL_ESCAPED=$(printf '%s' "$BROKER_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat <<EOF > /tmp/env.js
window.__APP_CONFIG__ = {
  VITE_WS_BROKER_URL: "${BROKER_URL_ESCAPED}"
};
EOF

echo "Runtime config generated: /tmp/env.js"
