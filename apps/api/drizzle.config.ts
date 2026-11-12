import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ?? 'postgres://emptyfridge:emptyfridge@localhost:5432/emptyfridge',
  },
  verbose: true,
  strict: true,
});
