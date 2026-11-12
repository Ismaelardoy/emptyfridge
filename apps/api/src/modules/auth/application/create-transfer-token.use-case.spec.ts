import { describe, expect, it } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import {
  NOW,
  fakeTransferTokenRepository,
  fixedClock,
  fixedTokens,
  makeUser,
  sequentialIds,
} from '../../../test/fakes';
import { CreateTransferTokenUseCase, TRANSFER_TTL_MS } from './create-transfer-token.use-case';

function build() {
  const transferTokens = fakeTransferTokenRepository();
  const useCase = new CreateTransferTokenUseCase(
    transferTokens,
    fixedTokens,
    fixedClock,
    sequentialIds('t'),
  );
  return { transferTokens, useCase };
}

describe('CreateTransferTokenUseCase', () => {
  it('crea un vale de 10 minutos y guarda solo el hash', async () => {
    const { transferTokens, useCase } = build();
    const user = makeUser({ id: 'u1' });

    const ticket = await useCase.execute(user);

    expect(ticket.code).toBe('ABCD2345EFGH');
    expect(ticket.expiresAt.getTime()).toBe(NOW.getTime() + TRANSFER_TTL_MS);
    expect(transferTokens.create).toHaveBeenCalledWith({
      id: 't-1',
      userId: 'u1',
      tokenHash: sha256('ABCD2345EFGH'),
      expiresAt: ticket.expiresAt,
      usedAt: null,
      createdAt: NOW,
    });
  });

  it('invalida los vales anteriores de la misma identidad', async () => {
    const { transferTokens, useCase } = build();

    await useCase.execute(makeUser({ id: 'u1' }));

    expect(transferTokens.deleteByUserId).toHaveBeenCalledWith('u1');
  });
});
