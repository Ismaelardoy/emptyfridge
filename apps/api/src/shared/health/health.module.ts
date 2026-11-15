import { Controller, Get, Header, HttpCode, HttpStatus, Inject, Module } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { DATABASE } from '../db/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Keep-alive para cron-job.org / Render: 204 sin cuerpo y sin tocar la base
   * de datos. cron-job.org aborta si la respuesta supera 64 KB; con 204 no hay
   * cuerpo que leer (ni chunked ni compresión que un cliente pueda acumular).
   */
  @Get()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('cache-control', 'no-store')
  ping(): void {}

  /** Comprobación real de la base de datos. Es la que usa Render. */
  @Get('db')
  async check(): Promise<{ status: 'ok' }> {
    await this.db.execute(sql`select 1`);
    return { status: 'ok' };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
