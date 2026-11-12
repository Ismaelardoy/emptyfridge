import { loadEnvFile } from 'node:process';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Permite ejecutar `pnpm db:migrate` desde apps/api sin exportar variables.
for (const path of ['.env', '../../.env']) {
  try {
    loadEnvFile(path);
    break;
  } catch {
    // El fichero no existe: seguimos con las variables del entorno.
  }
}

async function main(): Promise<void> {
  // Las migraciones solo necesitan la base de datos: no deben exigir el resto
  // de secretos de la aplicación.
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL es obligatoria para aplicar migraciones.');
  }

  const sslMode = process.env.DATABASE_SSL ?? 'disable';
  const prepare = (process.env.DATABASE_PREPARE ?? 'true') !== 'false';

  const client = postgres(databaseUrl, {
    max: 1,
    ssl: sslMode === 'disable' ? false : (sslMode as 'require' | 'verify-full'),
    prepare,
    onnotice: () => undefined,
  });

  try {
    // En plataformas como Render el contenedor puede arrancar antes de que
    // la base de datos esté lista. Reintentamos unos segundos.
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
        console.log('Migraciones aplicadas correctamente.');
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        console.warn(
          `Migraciones: intento ${attempt}/${maxAttempts} falló. Reintentando en 2 s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('No se pudieron aplicar las migraciones:', error);
  process.exit(1);
});
