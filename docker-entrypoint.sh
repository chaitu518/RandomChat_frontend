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

sed "s|\${PORT}|${PORT}|g" /etc/nginx/templates/default.conf.template > /tmp/default.conf

cat <<'EOF' > /tmp/nginx.conf
worker_processes auto;
pid /tmp/nginx.pid;

events {
	worker_connections 1024;
}

http {
	include       /etc/nginx/mime.types;
	default_type  application/octet-stream;

	access_log /dev/stdout;
	error_log  /dev/stderr warn;

	sendfile        on;
	keepalive_timeout 65;

	include /tmp/default.conf;
}
EOF

exec nginx -c /tmp/nginx.conf -g 'daemon off;'
