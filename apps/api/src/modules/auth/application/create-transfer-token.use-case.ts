import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import type { Clock, IdGenerator } from '../../../shared/domain/ports';
import { CLOCK, ID_GENERATOR } from '../../../shared/domain/ports';
import type { User } from '../domain/household';
import { TOKEN_GENERATOR, TRANSFER_TOKEN_REPOSITORY } from '../domain/ports';
import type { TokenGenerator, TransferTokenRepository } from '../domain/ports';

/** El enlace solo sirve para sentarse un momento delante del otro dispositivo. */
export const TRANSFER_TTL_MS = 10 * 60_000;

export interface TransferTicket {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class CreateTransferTokenUseCase {
  constructor(
    @Inject(TRANSFER_TOKEN_REPOSITORY) private readonly transferTokens: TransferTokenRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(user: User): Promise<TransferTicket> {
    const code = this.tokens.transferCode();
    const createdAt = this.clock.now();
    const expiresAt = new Date(createdAt.getTime() + TRANSFER_TTL_MS);

    // Un solo vale activo por identidad: generar otro invalida el anterior.
    await this.transferTokens.deleteByUserId(user.id);
    await this.transferTokens.create({
      id: this.ids.next(),
      userId: user.id,
      tokenHash: sha256(code),
      expiresAt,
      usedAt: null,
      createdAt,
    });

    return { code, expiresAt };
  }
}
