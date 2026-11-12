#!/bin/sh
set -eu

# En plataformas sin servicio de migraciones (Render free, Railway, Fly...)
# se puede activar RUN_MIGRATIONS=true. En Docker Compose lo hace el servicio
# `migrate` y la API arranca sin tocar el esquema.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Ejecutando migraciones antes de arrancar la API..."
  node dist/shared/db/migrate.js
fi

exec "$@"
