import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  DATABASE_SSL: z.enum(['disable', 'require', 'verify-full']).default('disable'),
  DATABASE_PREPARE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  PUBLIC_URL: z.string().url().default('http://localhost:8080'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Lee y valida la configuración de entorno de forma perezosa.
 * Así los tests unitarios no necesitan variables reales.
 */
export function env(): Env {
  if (cached) {
    return cached;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuración inválida: ${detail}`);
  }

  cached = result.data;
  return cached;
}
