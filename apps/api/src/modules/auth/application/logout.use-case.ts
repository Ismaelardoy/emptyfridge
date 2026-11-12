import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import { SESSION_REPOSITORY } from '../domain/ports';
import type { SessionRepository } from '../domain/ports';

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository) {}

  async execute(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await this.sessions.deleteByTokenHash(sha256(token));
  }
}
