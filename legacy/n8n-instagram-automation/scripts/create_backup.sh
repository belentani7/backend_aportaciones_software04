#!/usr/bin/env bash
# Creates a portable project backup without secrets, dependencies, Git metadata or generated files.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$PROJECT_ROOT/backups"
ARCHIVE="$BACKUP_DIR/Proyecto_${PROJECT_NAME}_Backup_${TIMESTAMP}.zip"

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_ROOT"

zip -r "$ARCHIVE" . \
  -x '.git/*' \
  -x 'node_modules/*' \
  -x '.env' \
  -x '.env.local' \
  -x '.env.production' \
  -x '.env.development' \
  -x '.env.test' \
  -x 'backups/*' \
  -x '__pycache__/*' \
  -x '*/__pycache__/*' \
  -x '*/__pycache__' \
  -x '*.pyc' \
  -x '*.log' \
  -x '.DS_Store' \
  -x 'dist/*' \
  -x 'coverage/*'

printf 'Backup created: %s\n' "$ARCHIVE"
printf 'SHA-256: '
sha256sum "$ARCHIVE" | awk '{print $1}'
