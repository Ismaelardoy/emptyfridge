import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client';
import { DATABASE } from '../../../shared/db/database.module';
import { transferTokens } from '../../../shared/db/schema';
import type { TransferToken } from '../domain/household';
import type { TransferTokenRepository } from '../domain/ports';

@Injectable()
export class DrizzleTransferTokenRepository implements TransferTokenRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(token: TransferToken): Promise<void> {
    await this.db.insert(transferTokens).values(token);
  }

  async consume(tokenHash: string, now: Date): Promise<TransferToken | null> {
    const [row] = await this.db
      .update(transferTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(transferTokens.tokenHash, tokenHash),
          isNull(transferTokens.usedAt),
          gt(transferTokens.expiresAt, now),
        ),
      )
      .returning();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(transferTokens).where(eq(transferTokens.userId, userId));
  }
}
