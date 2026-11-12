import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

export const DATABASE = Symbol('DATABASE');
export const PG_CLIENT = Symbol('PG_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: PG_CLIENT,
      useFactory: (): Sql => {
        const config = env();
        return postgres(config.DATABASE_URL, {
          max: 10,
          ssl: config.DATABASE_SSL === 'disable' ? false : config.DATABASE_SSL,
          prepare: config.DATABASE_PREPARE,
          onnotice: () => undefined,
        });
      },
    },
    {
      provide: DATABASE,
      useFactory: (client: Sql) => drizzle(client, { schema }),
      inject: [PG_CLIENT],
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_CLIENT) private readonly client: Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
