import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, ne, or } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client';
import { DATABASE } from '../../../shared/db/database.module';
import { sessions } from '../../../shared/db/schema';
import type { Session } from '../domain/household';
import type { SessionRepository } from '../domain/ports';

@Injectable()
export class DrizzleSessionRepository implements SessionRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(session: Session): Promise<void> {
    await this.db.insert(sessions).values(session);
  }

  async findValidByTokenHash(tokenHash: string, now: Date): Promise<Session | null> {
    const [row] = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          // Sin fecha = no caduca. Las sesiones antiguas sí tienen fecha.
          or(isNull(sessions.expiresAt), gt(sessions.expiresAt, now)),
        ),
      )
      .limit(1);

    return row
      ? {
          id: row.id,
          userId: row.userId,
          tokenHash: row.tokenHash,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
        }
      : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async deleteOthers(userId: string, keepTokenHash: string): Promise<number> {
    const deleted = await this.db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, keepTokenHash)))
      .returning({ id: sessions.id });

    return deleted.length;
  }
}
