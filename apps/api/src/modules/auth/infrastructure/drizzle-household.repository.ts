import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client';
import { DATABASE } from '../../../shared/db/database.module';
import { isUniqueViolation } from '../../../shared/db/errors';
import { householdMembers, households, users } from '../../../shared/db/schema';
import { AppError } from '../../../shared/errors/app-error';
import type { Household, HouseholdMember, Membership, Role } from '../domain/household';
import type { HouseholdRepository, NewHousehold } from '../domain/ports';

type HouseholdRow = typeof households.$inferSelect;

function toHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.inviteCode,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class DrizzleHouseholdRepository implements HouseholdRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findByInviteCode(inviteCode: string): Promise<Household | null> {
    const [row] = await this.db
      .select()
      .from(households)
      .where(eq(households.inviteCode, inviteCode))
      .limit(1);

    return row ? toHousehold(row) : null;
  }

  async findById(id: string): Promise<Household | null> {
    const [row] = await this.db.select().from(households).where(eq(households.id, id)).limit(1);

    return row ? toHousehold(row) : null;
  }

  async count(): Promise<number> {
    const [row] = await this.db
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(households);

    return row?.value ?? 0;
  }

  async listMembers(householdId: string): Promise<HouseholdMember[]> {
    const rows = await this.db
      .select({ user: users, member: householdMembers })
      .from(householdMembers)
      .innerJoin(users, eq(users.id, householdMembers.userId))
      .where(eq(householdMembers.householdId, householdId))
      .orderBy(householdMembers.joinedAt);

    return rows.map((row) => ({
      id: row.user.id,
      displayName: row.user.displayName,
      role: row.member.role,
      joinedAt: row.member.joinedAt,
    }));
  }

  async createHouseholdWithOwner(
    household: NewHousehold,
    userId: string,
    joinedAt: Date,
  ): Promise<Membership> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(households).values(household);
        await tx.insert(householdMembers).values({
          householdId: household.id,
          userId,
          role: 'owner',
          joinedAt,
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const constraint = (error as { constraint?: string }).constraint;
        if (constraint === 'households_invite_code_unique') {
          // El caso de uso reintenta con un código más largo.
          throw AppError.conflict('INVITE_CODE_COLLISION', 'Ese código de invitación ya existe.');
        }
        if (constraint === 'household_members_user_unique') {
          throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Ya estás en un hogar.');
        }
      }
      throw error;
    }

    return { household, role: 'owner', joinedAt };
  }

  async addMember(
    household: Household,
    userId: string,
    role: Role,
    joinedAt: Date,
  ): Promise<Membership> {
    try {
      await this.db.insert(householdMembers).values({
        householdId: household.id,
        userId,
        role,
        joinedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Ya estás en un hogar.');
      }
      throw error;
    }

    return { household, role, joinedAt };
  }

  async rename(householdId: string, name: string): Promise<Household | null> {
    const [row] = await this.db
      .update(households)
      .set({ name })
      .where(eq(households.id, householdId))
      .returning();

    return row ? toHousehold(row) : null;
  }

  async removeMember(householdId: string, userId: string): Promise<void> {
    await this.db
      .delete(householdMembers)
      .where(
        and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)),
      );
  }

  async transferOwnership(
    householdId: string,
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(householdMembers)
        .set({ role: 'member' })
        .where(
          and(
            eq(householdMembers.householdId, householdId),
            eq(householdMembers.userId, fromUserId),
          ),
        );
      await tx
        .update(householdMembers)
        .set({ role: 'owner' })
        .where(
          and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, toUserId)),
        );
    });
  }
}
