import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import type { Clock, IdGenerator } from '../../../shared/domain/ports';
import { CLOCK, ID_GENERATOR } from '../../../shared/domain/ports';
import { SESSION_REPOSITORY, TOKEN_GENERATOR } from '../domain/ports';
import type { SessionRepository, TokenGenerator } from '../domain/ports';

export interface IssuedSession {
  token: string;
}

@Injectable()
export class IssueSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(userId: string): Promise<IssuedSession> {
    const token = this.tokens.sessionToken();

    await this.sessions.create({
      id: this.ids.next(),
      userId,
      tokenHash: sha256(token),
      expiresAt: null,
      createdAt: this.clock.now(),
    });

    return { token };
  }
}
