import { z } from 'zod';
import { uuidSchema } from './common';

// Los códigos pueden crecer con el número de hogares (ver inviteCodeLengthFor).
// Se aceptan longitudes antiguas para no romper enlaces ya compartidos.
export const MIN_INVITE_CODE_LENGTH = 6;
export const MAX_INVITE_CODE_LENGTH = 12;
export const INVITE_CODE_REGEX = new RegExp(
  `^[A-Z0-9]{${MIN_INVITE_CODE_LENGTH},${MAX_INVITE_CODE_LENGTH}}$`,
);

export const householdNameSchema = z
  .string()
  .trim()
  .min(1, 'Escribe un nombre para el hogar')
  .max(60, 'Máximo 60 caracteres');

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(INVITE_CODE_REGEX, 'El código debe tener entre 6 y 12 caracteres');

export const roleSchema = z.enum(['owner', 'member']);
export type Role = z.infer<typeof roleSchema>;

export const createHouseholdInputSchema = z.object({
  name: householdNameSchema,
});
export type CreateHouseholdInput = z.infer<typeof createHouseholdInputSchema>;

export const joinHouseholdInputSchema = z.object({
  inviteCode: inviteCodeSchema,
});
export type JoinHouseholdInput = z.infer<typeof joinHouseholdInputSchema>;

export const renameHouseholdInputSchema = z.object({
  name: householdNameSchema,
});
export type RenameHouseholdInput = z.infer<typeof renameHouseholdInputSchema>;

/** Ceder la propiedad del hogar a otro miembro. */
export const transferOwnershipInputSchema = z.object({
  memberId: uuidSchema,
});
export type TransferOwnershipInput = z.infer<typeof transferOwnershipInputSchema>;

/**
 * Traspaso de identidad a otro dispositivo: código de un solo uso y caducidad corta.
 * No es una cuenta ni una contraseña; solo mueve la sesión que ya existe.
 */
export const TRANSFER_CODE_LENGTH = 12;
export const TRANSFER_CODE_REGEX = /^[A-Z0-9]{12}$/;

/** Acepta "XXXX-XXXX-XXXX", el código pelado o el enlace completo `/transfer/<código>`. */
export function normalizeAccessCode(value: string): string {
  const withoutUrl = value.trim().replace(/^.*\/(?:transfer|recover)\//i, '');
  return withoutUrl.replace(/[\s-]/g, '').toUpperCase();
}

export function normalizeTransferCode(value: string): string {
  return normalizeAccessCode(value);
}

export function formatTransferCode(value: string): string {
  return normalizeTransferCode(value).replace(/(.{4})(?=.)/g, '$1-');
}

export const transferCodeSchema = z
  .string()
  .trim()
  .min(1, 'Pega el código o el enlace')
  .transform(normalizeTransferCode)
  .refine((code) => TRANSFER_CODE_REGEX.test(code), 'El código debe tener 12 caracteres');

export const transferTicketDtoSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});
export type TransferTicketDto = z.infer<typeof transferTicketDtoSchema>;

export const redeemTransferInputSchema = z.object({
  code: transferCodeSchema,
});
export type RedeemTransferInput = z.infer<typeof redeemTransferInputSchema>;

/**
 * Código de recuperación: secreto largo por identidad para volver a entrar
 * aunque se pierda el dispositivo o se borren las cookies. No es usuario+PIN:
 * no hay nombre de usuario y solo se guarda su hash.
 */
export const RECOVERY_CODE_LENGTH = 16;
export const RECOVERY_CODE_REGEX = /^[A-Z0-9]{16}$/;

export function normalizeRecoveryCode(value: string): string {
  return normalizeAccessCode(value);
}

export function formatRecoveryCode(value: string): string {
  return normalizeRecoveryCode(value).replace(/(.{4})(?=.)/g, '$1-');
}

export const recoveryCodeSchema = z
  .string()
  .trim()
  .min(1, 'Pega tu código de recuperación')
  .transform(normalizeRecoveryCode)
  .refine((code) => RECOVERY_CODE_REGEX.test(code), 'El código debe tener 16 caracteres');

export const recoveryCodeDtoSchema = z.object({
  code: z.string(),
});
export type RecoveryCodeDto = z.infer<typeof recoveryCodeDtoSchema>;

export const recoverIdentityInputSchema = z.object({
  code: recoveryCodeSchema,
});
export type RecoverIdentityInput = z.infer<typeof recoverIdentityInputSchema>;

/** Referencia pública a una persona (autor de un producto, quién cerró). */
export const memberRefSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});
export type MemberRefDto = z.infer<typeof memberRefSchema>;

export const householdSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  inviteCode: z.string(),
});
export type HouseholdSummaryDto = z.infer<typeof householdSummarySchema>;

export const userHouseholdSchema = householdSummarySchema.extend({
  role: roleSchema,
});
export type UserHouseholdDto = z.infer<typeof userHouseholdSchema>;

export const userDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  household: userHouseholdSchema.nullable(),
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const authResultDtoSchema = z.object({
  user: userDtoSchema,
});
export type AuthResultDto = z.infer<typeof authResultDtoSchema>;

export const householdMemberDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  role: roleSchema,
  joinedAt: z.string(),
});
export type HouseholdMemberDto = z.infer<typeof householdMemberDtoSchema>;

export const householdDtoSchema = z.object({
  household: householdSummarySchema,
  members: z.array(householdMemberDtoSchema),
});
export type HouseholdDto = z.infer<typeof householdDtoSchema>;
