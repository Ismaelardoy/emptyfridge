import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client';
import { DATABASE } from '../../../shared/db/database.module';
import { isUniqueViolation } from '../../../shared/db/errors';
import { householdMembers, households, users } from '../../../shared/db/schema';
import { AppError } from '../../../shared/errors/app-error';
import type { Household, Membership, User } from '../domain/household';
import type { NewUser, UserRepository } from '../domain/ports';

type UserRow = typeof users.$inferSelect;
type HouseholdRow = typeof households.$inferSelect;
type MemberRow = typeof householdMembers.$inferSelect;

function toHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.inviteCode,
    createdAt: row.createdAt,
  };
}

function toMembership(member: MemberRow, household: HouseholdRow): Membership {
  return {
    household: toHousehold(household),
    role: member.role,
    joinedAt: member.joinedAt,
  };
}

function toUser(
  row: UserRow,
  membership: { member: MemberRow; household: HouseholdRow } | null,
): User {
  return {
    id: row.id,
    displayName: row.displayName,
    displayNameKey: row.displayNameKey,
    createdAt: row.createdAt,
    membership: membership ? toMembership(membership.member, membership.household) : null,
  };
}

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findByIdWithMembership(id: string): Promise<User | null> {
    const [row] = await this.db
      .select({ user: users, member: householdMembers, household: households })
      .from(users)
      .leftJoin(householdMembers, eq(householdMembers.userId, users.id))
      .leftJoin(households, eq(households.id, householdMembers.householdId))
      .where(eq(users.id, id))
      .limit(1);

    return row ? this.toUserFromRow(row) : null;
  }

  async findByDisplayNameKey(displayNameKey: string): Promise<User | null> {
    const [row] = await this.db
      .select({ user: users, member: householdMembers, household: households })
      .from(users)
      .leftJoin(householdMembers, eq(householdMembers.userId, users.id))
      .leftJoin(households, eq(households.id, householdMembers.householdId))
      .where(eq(users.displayNameKey, displayNameKey))
      .limit(1);

    return row ? this.toUserFromRow(row) : null;
  }

  async findByRecoveryCodeHash(recoveryCodeHash: string): Promise<User | null> {
    const [row] = await this.db
      .select({ user: users, member: householdMembers, household: households })
      .from(users)
      .leftJoin(householdMembers, eq(householdMembers.userId, users.id))
      .leftJoin(households, eq(households.id, householdMembers.householdId))
      .where(eq(users.recoveryCodeHash, recoveryCodeHash))
      .limit(1);

    return row ? this.toUserFromRow(row) : null;
  }

  async updateRecoveryCodeHash(userId: string, recoveryCodeHash: string): Promise<void> {
    try {
      await this.db.update(users).set({ recoveryCodeHash }).where(eq(users.id, userId));
    } catch (error) {
      if (isUniqueViolation(error)) {
        const constraint = (error as { constraint?: string }).constraint;
        if (constraint === 'users_recovery_code_hash') {
          throw AppError.conflict('RECOVERY_CODE_COLLISION', 'Ese código ya existe.');
        }
      }
      throw error;
    }
  }

  async create(user: NewUser): Promise<User> {
    try {
      await this.db.insert(users).values(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw AppError.conflict(
          'DISPLAY_NAME_TAKEN',
          'Ese nombre de usuario ya está en uso. Prueba otro.',
        );
      }
      throw error;
    }

    return {
      id: user.id,
      displayName: user.displayName,
      displayNameKey: user.displayNameKey,
      createdAt: user.createdAt,
      membership: null,
    };
  }

  private toUserFromRow(row: {
    user: UserRow;
    member: MemberRow | null;
    household: HouseholdRow | null;
  }): User {
    return toUser(
      row.user,
      row.member && row.household ? { member: row.member, household: row.household } : null,
    );
  }
}
