import { Controller, Get, Header, Inject, Module } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { DATABASE } from '../db/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Keep-alive para cron-job.org / Render: 200 con un JSON mínimo (15 bytes) y
   * sin tocar la base de datos.
   *
   * No devolver 204: con cuerpo vacío, cron-job.org fallaba con «Failed
   * (output too large)» aunque la respuesta era de 0 bytes (se queda leyendo
   * bytes de la conexión reutilizada hasta pasarse de su límite de 8 KB). Con
   * un cuerpo corto y con `content-length` el framing es inequívoco.
   */
  @Get()
  @Header('cache-control', 'no-store')
  ping(): { status: 'ok' } {
    return { status: 'ok' };
  }

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
