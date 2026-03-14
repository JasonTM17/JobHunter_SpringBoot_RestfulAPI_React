#!/bin/sh
set -eu

BOOTSTRAP_SOURCE="/opt/bootstrap-storage/company"
BOOTSTRAP_TARGET="/app/storage/company"

if [ -d "$BOOTSTRAP_SOURCE" ]; then
  mkdir -p "$BOOTSTRAP_TARGET"

  find "$BOOTSTRAP_SOURCE" -maxdepth 1 -type f | while IFS= read -r source_file; do
    target_file="$BOOTSTRAP_TARGET/$(basename "$source_file")"
    if [ ! -f "$target_file" ]; then
      cp "$source_file" "$target_file"
    fi
  done
fi

exec java -jar /app/app.jar
