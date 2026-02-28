#!/bin/sh
set -eu

PORT="${PORT:-3000}"

if [ -z "${VITE_WS_BROKER_URL:-}" ]; then
	echo "Error: VITE_WS_BROKER_URL is required at runtime." >&2
	exit 1
fi

BROKER_URL_ESCAPED=$(printf '%s' "$VITE_WS_BROKER_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp

cat <<EOF > /tmp/env.js
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

	client_body_temp_path /tmp/client_temp;
	proxy_temp_path       /tmp/proxy_temp;
	fastcgi_temp_path     /tmp/fastcgi_temp;
	uwsgi_temp_path       /tmp/uwsgi_temp;
	scgi_temp_path        /tmp/scgi_temp;

	access_log /dev/stdout;
	error_log  /dev/stderr warn;

	sendfile        on;
	keepalive_timeout 65;

	include /tmp/default.conf;
}
EOF

nginx -t -c /tmp/nginx.conf

exec nginx -c /tmp/nginx.conf -g 'daemon off;'
