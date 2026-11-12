export type Role = 'owner' | 'member';

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
}

export interface Membership {
  household: Household;
  role: Role;
  joinedAt: Date;
}

export interface User {
  id: string;
  displayName: string;
  displayNameKey: string;
  createdAt: Date;
  membership: Membership | null;
}

export interface HouseholdMember {
  id: string;
  displayName: string;
  role: Role;
  joinedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  /** `null` = no caduca. Se mantiene para sesiones antiguas. */
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Vale de un solo uso para abrir la identidad en otro dispositivo.
 * En la base de datos solo vive el hash del código.
 */
export interface TransferToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/** Contexto ya validado para operar dentro de un hogar. */
export interface HouseholdActor {
  id: string;
  displayName: string;
  householdId: string;
  role: Role;
}
