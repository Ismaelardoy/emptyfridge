#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="backups/emptyfridge-$STAMP.sql.gz"

# Usa las variables del contenedor de Postgres, no las del host.
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$FILE"

# Conserva 30 días de copias.
find backups -name '*.sql.gz' -mtime +30 -delete

printf 'Backup creado: %s\n' "$FILE"
