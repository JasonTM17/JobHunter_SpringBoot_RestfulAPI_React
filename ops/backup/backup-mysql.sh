#!/usr/bin/env sh
set -eu

BACKUP_DIR="${MYSQL_BACKUP_DIR:-/backups}"
INTERVAL_SECONDS="${MYSQL_BACKUP_INTERVAL_SECONDS:-86400}"
RETENTION_DAYS="${MYSQL_BACKUP_RETENTION_DAYS:-14}"
HOST="${MYSQL_HOST:-db}"
PORT="${MYSQL_PORT:-3306}"
DATABASE="${MYSQL_DATABASE:-jobhunter}"
USER="${MYSQL_USER:-jobhunter}"
PASSWORD="${MYSQL_PASSWORD:-}"
ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"

mkdir -p "$BACKUP_DIR"

run_backup() {
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  output="${BACKUP_DIR}/${DATABASE}-${timestamp}.sql.gz"
  temp_sql="${BACKUP_DIR}/${DATABASE}-${timestamp}.sql"

  echo "[backup] creating ${output}"
  if [ -n "$PASSWORD" ]; then
    MYSQL_PWD="$PASSWORD" mysqldump \
      --host="$HOST" \
      --port="$PORT" \
      --user="$USER" \
      --single-transaction \
      --no-tablespaces \
      --routines \
      --triggers \
      --events \
      --set-gtid-purged=OFF \
      "$DATABASE" > "$temp_sql"
  else
    MYSQL_PWD="$ROOT_PASSWORD" mysqldump \
      --host="$HOST" \
      --port="$PORT" \
      --user=root \
      --single-transaction \
      --no-tablespaces \
      --routines \
      --triggers \
      --events \
      --set-gtid-purged=OFF \
      "$DATABASE" > "$temp_sql"
  fi

  gzip -9 -f "$temp_sql"
  echo "[backup] pruning backups older than ${RETENTION_DAYS} day(s)"
  find "$BACKUP_DIR" -type f -name "${DATABASE}-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
  echo "[backup] completed ${output}"
}

if [ "${1:-}" = "--loop" ]; then
  while true; do
    run_backup
    echo "[backup] sleeping ${INTERVAL_SECONDS} second(s)"
    sleep "$INTERVAL_SECONDS"
  done
else
  run_backup
fi
