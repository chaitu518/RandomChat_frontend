#!/bin/sh
set -eu

PORT="${PORT:-3000}"

sed "s|\${PORT}|${PORT}|g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
