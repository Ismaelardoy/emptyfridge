import { Controller, Get, Header, Inject, Module } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { DATABASE } from '../db/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Keep-alive para cron-job.org / Render: 200 con `OK` (2 bytes) y sin tocar
   * la base de datos.
   *
   * cron-job.org corta la conexión y marca «Failed (output too large)» cuando
   * el cuerpo pasa de 4 KB (límite de la cuenta gratuita). Si eso aparece con
   * este endpoint, el cuerpo grande NO sale de la API: lo devuelve un
   * intermediario (Cloudflare delante de Render, el proxy de Vercel o una
   * página de error del plan gratuito). Comprobado con `curl`: aquí salen 15
   * bytes. Para que no pueda pasar nunca, el trabajo de cron debe usar el
   * método HEAD, que no tiene cuerpo.
   */
  @Get()
  @Header('cache-control', 'no-store')
  @Header('content-type', 'text/plain; charset=utf-8')
  ping(): string {
    return 'OK';
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
