import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export function createDatabase(url: string) {
  const client = postgres(url, { max: 10, onnotice: () => undefined });
  const db = drizzle(client, { schema });
  return { client, db };
}
