#!/bin/sh
set -e

mkdir -p /app/uploads
chown -R appuser:nodejs /app/uploads

exec su-exec appuser "$@"
