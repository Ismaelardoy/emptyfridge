import { z } from 'zod';

/**
 * Acepta UUIDs de cualquier versión (la app genera v7).
 * Evita que un id inválido llegue a Postgres y se convierta en un 500.
 */
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'ID no válido');
