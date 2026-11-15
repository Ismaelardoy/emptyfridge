import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { env } from '../config/env';
import { MaintenanceService } from './maintenance.service';
import * as schema from './schema';
import { DATABASE, PG_CLIENT } from './tokens';

export { DATABASE, PG_CLIENT } from './tokens';

@Global()
@Module({
  providers: [
    {
      provide: PG_CLIENT,
      useFactory: (): Sql => {
        const config = env();
        return postgres(config.DATABASE_URL, {
          max: 10,
          // Recicla conexiones: contra el Session Pooler de Supabase cada
          // socket ocupa un backend. Sin esto quedan abiertas para siempre.
          idle_timeout: 30,
          max_lifetime: 30 * 60,
          connect_timeout: 10,
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
    MaintenanceService,
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_CLIENT) private readonly client: Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
