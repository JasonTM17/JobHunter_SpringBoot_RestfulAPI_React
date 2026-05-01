#!/usr/bin/env sh
set -eu

BACKUP_FILE="${1:-}"
HOST="${MYSQL_HOST:-db}"
PORT="${MYSQL_PORT:-3306}"
DATABASE="${MYSQL_DATABASE:-jobhunter}"
USER="${MYSQL_USER:-jobhunter}"
PASSWORD="${MYSQL_PASSWORD:-}"
ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: restore-mysql.sh /backups/<backup-file>.sql.gz" >&2
  exit 2
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 2
fi

echo "[restore] restoring ${BACKUP_FILE} into ${DATABASE}"

if [ -n "$PASSWORD" ]; then
  gunzip -c "$BACKUP_FILE" | MYSQL_PWD="$PASSWORD" mysql \
    --host="$HOST" \
    --port="$PORT" \
    --user="$USER" \
    "$DATABASE"
else
  gunzip -c "$BACKUP_FILE" | MYSQL_PWD="$ROOT_PASSWORD" mysql \
    --host="$HOST" \
    --port="$PORT" \
    --user=root \
    "$DATABASE"
fi

echo "[restore] completed"

