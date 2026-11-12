import { RECOVERY_CODE_LENGTH, TRANSFER_CODE_LENGTH } from '@emptyfridge/contracts';
import { Injectable } from '@nestjs/common';
import { randomInviteCode, randomToken } from '../../../shared/crypto';
import type { TokenGenerator } from '../domain/ports';

@Injectable()
export class CryptoTokenGenerator implements TokenGenerator {
  sessionToken(): string {
    return randomToken();
  }

  inviteCode(length?: number): string {
    return randomInviteCode(length);
  }

  transferCode(): string {
    return randomInviteCode(TRANSFER_CODE_LENGTH);
  }

  recoveryCode(): string {
    return randomInviteCode(RECOVERY_CODE_LENGTH);
  }
}
