import type {
  Household,
  HouseholdMember,
  Membership,
  Role,
  Session,
  TransferToken,
  User,
} from './household';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface NewUser {
  id: string;
  displayName: string;
  displayNameKey: string;
  createdAt: Date;
}

export interface UserRepository {
  findByIdWithMembership(id: string): Promise<User | null>;
  findByDisplayNameKey(displayNameKey: string): Promise<User | null>;
  findByRecoveryCodeHash(recoveryCodeHash: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  updateRecoveryCodeHash(userId: string, recoveryCodeHash: string): Promise<void>;
}

export const HOUSEHOLD_REPOSITORY = Symbol('HOUSEHOLD_REPOSITORY');

export interface NewHousehold {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
}

export interface HouseholdRepository {
  findByInviteCode(inviteCode: string): Promise<Household | null>;
  findById(id: string): Promise<Household | null>;
  /** Número de hogares existentes, para elegir la longitud del código de invitación. */
  count(): Promise<number>;
  listMembers(householdId: string): Promise<HouseholdMember[]>;
  createHouseholdWithOwner(
    household: NewHousehold,
    userId: string,
    joinedAt: Date,
  ): Promise<Membership>;
  addMember(household: Household, userId: string, role: Role, joinedAt: Date): Promise<Membership>;
  rename(householdId: string, name: string): Promise<Household | null>;
  removeMember(householdId: string, userId: string): Promise<void>;
  /** Cede la propiedad: el actor pasa a miembro y el destino a owner. */
  transferOwnership(householdId: string, fromUserId: string, toUserId: string): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface SessionRepository {
  create(session: Session): Promise<void>;
  findValidByTokenHash(tokenHash: string, now: Date): Promise<Session | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  /** Borra todas las sesiones de la identidad menos la del token indicado. */
  deleteOthers(userId: string, keepTokenHash: string): Promise<number>;
}

export const TRANSFER_TOKEN_REPOSITORY = Symbol('TRANSFER_TOKEN_REPOSITORY');

export interface TransferTokenRepository {
  create(token: TransferToken): Promise<void>;
  /**
   * Consume el vale de forma atómica: lo marca como usado solo si sigue sin usar
   * y no ha caducado. Devuelve null si no hay ningún vale válido.
   */
  consume(tokenHash: string, now: Date): Promise<TransferToken | null>;
  /** Invalida los vales pendientes de una identidad (al generar uno nuevo). */
  deleteByUserId(userId: string): Promise<void>;
}

export const TOKEN_GENERATOR = Symbol('TOKEN_GENERATOR');

export interface TokenGenerator {
  sessionToken(): string;
  inviteCode(length?: number): string;
  transferCode(): string;
  recoveryCode(): string;
}
