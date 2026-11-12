import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const households = pgTable('households', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    displayName: text('display_name').notNull(),
    displayNameKey: text('display_name_key').notNull(),
    recoveryCodeHash: text('recovery_code_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_display_name_key').on(table.displayNameKey),
    uniqueIndex('users_recovery_code_hash').on(table.recoveryCodeHash),
  ],
);

export const householdMembers = pgTable(
  'household_members',
  {
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'member'] })
      .notNull()
      .default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.userId] }),
    // Un hogar por cuenta. Para varios hogares, quitar este índice y añadir
    // un selector en la app.
    uniqueIndex('household_members_user_unique').on(table.userId),
    check('household_members_role_check', sql`role in ('owner', 'member')`),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Null = sesión sin caducidad.
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('sessions_user_idx').on(table.userId)],
);

/**
 * Enlaces temporales para abrir la misma identidad en otro dispositivo.
 * Solo se guarda el hash; caducan pronto y se consumen una única vez.
 */
export const transferTokens = pgTable(
  'transfer_tokens',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('transfer_tokens_user_idx').on(table.userId)],
);

export const lists = pgTable(
  'lists',
  {
    id: uuid('id').primaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['open', 'done'] })
      .notNull()
      .default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedBy: uuid('closed_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    // Solo puede existir una lista abierta por hogar.
    uniqueIndex('lists_one_open_per_household')
      .on(table.householdId)
      .where(sql`status = 'open'`),
    index('lists_household_closed_idx').on(table.householdId, table.closedAt),
    check('lists_status_check', sql`status in ('open', 'done')`),
  ],
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey(),
    listId: uuid('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    quantity: real('quantity'),
    unit: text('unit'),
    checked: boolean('checked').notNull().default(false),
    addedBy: uuid('added_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('items_list_idx').on(table.listId),
    // Evita duplicados pendientes incluso si dos personas añaden el mismo
    // producto a la vez. Un producto ya comprado sí puede repetirse.
    uniqueIndex('items_one_pending_per_name')
      .on(table.listId, table.normalizedName)
      .where(sql`checked = false`),
    check('items_unit_check', sql`unit is null or unit in ('ud', 'kg', 'g', 'L', 'ml', 'paquete')`),
    check('items_quantity_check', sql`quantity is null or quantity > 0`),
  ],
);
