#!/bin/sh
set -eu

PORT="${PORT:-3000}"

if [ -z "${VITE_WS_BROKER_URL:-}" ]; then
	echo "Error: VITE_WS_BROKER_URL is required at runtime." >&2
	exit 1
fi

BROKER_URL_ESCAPED=$(printf '%s' "$VITE_WS_BROKER_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat <<EOF > /usr/share/nginx/html/env.js
window.__APP_CONFIG__ = {
	VITE_WS_BROKER_URL: "${BROKER_URL_ESCAPED}"
};
EOF

sed "s|\${PORT}|${PORT}|g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
