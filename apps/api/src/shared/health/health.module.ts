import { Controller, Get, Header, Inject, Module } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { DATABASE } from '../db/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Liveness para Render: 200 con `OK` (2 bytes) y sin tocar la base de datos.
   *
   * Es el `healthCheckPath` de `render.yaml` a propósito. Render sondea cada
   * pocos segundos y reinicia la instancia si falla 15 s seguidos; con una
   * consulta a BD aquí, cualquier hipo de Supabase (red, mantenimiento, CPU
   * compartida) provocaba un reinicio y ~1-2 min de 502. Reiniciar no arregla
   * un problema de BD, solo añade caída.
   *
   * Este endpoint NO sustituye al keep-alive: el cron externo debe seguir
   * llamando a `/health/db` para mantener despiertos Render (plan free) y
   * Supabase free (que se pausa tras 7 días sin actividad de BD).
   */
  @Get()
  @Header('cache-control', 'no-store')
  @Header('content-type', 'text/plain; charset=utf-8')
  ping(): string {
    return 'OK';
  }

  /**
   * Comprobación real de la base de datos. La usa el cron externo /
   * monitor (UptimeRobot, BetterStack...), no Render.
   */
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
