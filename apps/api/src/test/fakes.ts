import { vi } from 'vitest';
import type {
  Household,
  HouseholdActor,
  Membership,
  Session,
  User,
} from '../modules/auth/domain/household';
import type {
  HouseholdRepository,
  SessionRepository,
  TokenGenerator,
  TransferTokenRepository,
  UserRepository,
} from '../modules/auth/domain/ports';
import type { ShoppingListRepository } from '../modules/lists/domain/ports';
import type { ReopenResult } from '../modules/lists/domain/shopping-list';

export const NOW = new Date('2026-01-15T10:00:00.000Z');

export const fixedClock = {
  now: () => NOW,
};

export function sequentialIds(prefix = 'id') {
  let counter = 0;
  return {
    next: () => {
      counter += 1;
      return `${prefix}-${counter}`;
    },
  };
}

export function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    id: 'h1',
    name: 'Casa',
    inviteCode: 'ABCD2345',
    createdAt: NOW,
    ...overrides,
  };
}

export function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    household: makeHousehold(),
    role: 'owner',
    joinedAt: NOW,
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    displayName: 'Ana',
    displayNameKey: 'ana',
    createdAt: NOW,
    recoveryCode: null,
    membership: makeMembership(),
    ...overrides,
  };
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    userId: 'u1',
    tokenHash: 'token-hash',
    expiresAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

export function makeHouseholdActor(overrides: Partial<HouseholdActor> = {}): HouseholdActor {
  return {
    id: 'u1',
    displayName: 'Ana',
    householdId: 'h1',
    role: 'owner',
    ...overrides,
  };
}

export function fakeUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByIdWithMembership: vi.fn(async () => null),
    findByDisplayNameKey: vi.fn(async () => null),
    findByRecoveryCodeHash: vi.fn(async () => null),
    create: vi.fn(),
    updateDisplayName: vi.fn(async () => undefined),
    updateRecoveryCode: vi.fn(async () => undefined),
    deleteById: vi.fn(async () => undefined),
    ...overrides,
  } as UserRepository;
}

export function fakeHouseholdRepository(
  overrides: Partial<HouseholdRepository> = {},
): HouseholdRepository {
  return {
    findByInviteCode: vi.fn(async () => null),
    findById: vi.fn(async () => null),
    count: vi.fn(async () => 0),
    listMembers: vi.fn(async () => []),
    createHouseholdWithOwner: vi.fn(),
    addMember: vi.fn(),
    rename: vi.fn(async () => null),
    removeMember: vi.fn(async () => undefined),
    transferOwnership: vi.fn(async () => undefined),
    ...overrides,
  } as HouseholdRepository;
}

export function fakeSessionRepository(
  overrides: Partial<SessionRepository> = {},
): SessionRepository {
  return {
    create: vi.fn(async () => undefined),
    findValidByTokenHash: vi.fn(async () => null),
    deleteByTokenHash: vi.fn(async () => undefined),
    deleteByUserId: vi.fn(async () => undefined),
    deleteOthers: vi.fn(async () => 0),
    ...overrides,
  } as SessionRepository;
}

export const fixedTokens: TokenGenerator = {
  sessionToken: () => 'session-token',
  inviteCode: () => 'ABCD2345',
  transferCode: () => 'ABCD2345EFGH',
  recoveryCode: () => 'ABCD2345EFGHJKLM',
};

export function fakeTransferTokenRepository(
  overrides: Partial<TransferTokenRepository> = {},
): TransferTokenRepository {
  return {
    create: vi.fn(async () => undefined),
    consume: vi.fn(async () => null),
    deleteByUserId: vi.fn(async () => undefined),
    ...overrides,
  } as TransferTokenRepository;
}

export function fakeShoppingListRepository(
  overrides: Partial<ShoppingListRepository> = {},
): ShoppingListRepository {
  return {
    findOpen: vi.fn(async () => null),
    ensureOpen: vi.fn(),
    listItems: vi.fn(async () => []),
    findOpenItemByNormalizedName: vi.fn(async () => null),
    addItem: vi.fn(),
    updateItem: vi.fn(async () => null),
    deleteItem: vi.fn(async () => false),
    finish: vi.fn(async () => null),
    reopen: vi.fn(async (): Promise<ReopenResult> => 'not-found'),
    findLastFinished: vi.fn(async () => null),
    productUsage: vi.fn(async () => []),
    ...overrides,
  } as ShoppingListRepository;
}
