import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/app-error';
import {
  NOW,
  fakeHouseholdRepository,
  fakeUserRepository,
  fixedClock,
  fixedTokens,
  makeHousehold,
  makeUser,
  sequentialIds,
} from '../../../test/fakes';
import { CreateHouseholdUseCase } from './create-household.use-case';

function build(
  overrides: {
    count?: number;
    attempts?: Array<ReturnType<typeof AppError.conflict> | 'ok'>;
  } = {},
) {
  const tokens = { ...fixedTokens, inviteCode: vi.fn((length = 6) => 'A'.repeat(length)) };
  const create = vi.fn();
  for (const attempt of overrides.attempts ?? ['ok']) {
    if (attempt === 'ok') {
      create.mockResolvedValueOnce({ household: makeHousehold(), role: 'owner', joinedAt: NOW });
    } else {
      create.mockRejectedValueOnce(attempt);
    }
  }

  const households = fakeHouseholdRepository({
    count: vi.fn(async () => overrides.count ?? 0),
    createHouseholdWithOwner: create,
  });
  const users = fakeUserRepository({
    findByIdWithMembership: vi.fn(async () => makeUser({ id: 'u1' })),
  });
  const useCase = new CreateHouseholdUseCase(
    users,
    households,
    tokens,
    fixedClock,
    sequentialIds('h'),
  );

  return { useCase, tokens, create };
}

describe('CreateHouseholdUseCase', () => {
  it('elige la longitud del código según los hogares existentes', async () => {
    const { useCase, tokens } = build({ count: 200_000 });

    await useCase.execute(makeUser({ id: 'u1', membership: null }), { name: 'Casa' });

    expect(tokens.inviteCode).toHaveBeenCalledWith(7);
  });

  it('si el código choca, reintenta con uno más largo', async () => {
    const { useCase, tokens, create } = build({
      attempts: [AppError.conflict('INVITE_CODE_COLLISION', 'repetido'), 'ok'],
    });

    await useCase.execute(makeUser({ id: 'u1', membership: null }), { name: 'Casa' });

    expect(tokens.inviteCode).toHaveBeenNthCalledWith(1, 6);
    expect(tokens.inviteCode).toHaveBeenNthCalledWith(2, 7);
    expect(create).toHaveBeenCalledTimes(2);
  });
});
