import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { and, isNotNull, lt } from 'drizzle-orm';
import type { Database } from './client';
import { sessions, transferTokens } from './schema';
import { DATABASE } from './tokens';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = DAY_MS;
/** Los vales duran 10 minutos; a los 7 días ya no sirven ni para auditar. */
const TOKEN_RETENTION_MS = 7 * DAY_MS;

/**
 * Limpieza periódica de filas que ya no pueden usarse. No toca las sesiones
 * sin caducidad: su cookie se renueva en cada visita (400 días deslizantes),
 * así que borrarlas por antigüedad expulsaría a usuarios activos.
 */
@Injectable()
export class MaintenanceService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger('maintenance');
  private timer: NodeJS.Timeout | null = null;

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  onModuleInit(): void {
    void this.run();
    this.timer = setInterval(() => void this.run(), CLEANUP_INTERVAL_MS);
    // No mantiene vivo el proceso (tests, scripts, apagado).
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async run(): Promise<void> {
    const now = Date.now();

    const expiredSessions = await this.db
      .delete(sessions)
      .where(and(isNotNull(sessions.expiresAt), lt(sessions.expiresAt, new Date(now - DAY_MS))))
      .returning({ id: sessions.id });

    const oldTokens = await this.db
      .delete(transferTokens)
      .where(lt(transferTokens.createdAt, new Date(now - TOKEN_RETENTION_MS)))
      .returning({ id: transferTokens.id });

    if (expiredSessions.length > 0 || oldTokens.length > 0) {
      this.logger.log(
        `Limpieza: ${expiredSessions.length} sesiones caducadas y ${oldTokens.length} vales antiguos`,
      );
    }
  }
}
