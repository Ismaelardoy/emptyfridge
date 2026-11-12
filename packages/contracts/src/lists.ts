import { z } from 'zod';
import { memberRefSchema } from './auth';

export const units = ['ud', 'kg', 'g', 'L', 'ml', 'paquete'] as const;
export const unitSchema = z.enum(units);
export type Unit = z.infer<typeof unitSchema>;

export const listStatusSchema = z.enum(['open', 'done']);
export type ListStatus = z.infer<typeof listStatusSchema>;

const itemNameSchema = z
  .string()
  .trim()
  .min(1, 'Escribe un producto')
  .max(80, 'Máximo 80 caracteres');

const quantitySchema = z.number().positive().max(9999).nullable();

export const addItemInputSchema = z.object({
  name: itemNameSchema,
  quantity: quantitySchema.optional(),
  unit: unitSchema.nullable().optional(),
});
export type AddItemInput = z.infer<typeof addItemInputSchema>;

export const updateItemInputSchema = z
  .object({
    name: itemNameSchema.optional(),
    quantity: quantitySchema.optional(),
    unit: unitSchema.nullable().optional(),
    checked: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Nada que actualizar',
  });
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

export const itemDtoSchema = z.object({
  id: z.string(),
  listId: z.string(),
  name: z.string(),
  quantity: z.number().nullable(),
  unit: unitSchema.nullable(),
  checked: z.boolean(),
  addedBy: memberRefSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ItemDto = z.infer<typeof itemDtoSchema>;

export const itemResponseDtoSchema = z.object({
  item: itemDtoSchema,
});
export type ItemResponseDto = z.infer<typeof itemResponseDtoSchema>;

export const listDtoSchema = z.object({
  id: z.string(),
  status: listStatusSchema,
  createdAt: z.string(),
  closedAt: z.string().nullable(),
  closedBy: memberRefSchema.nullable(),
  items: z.array(itemDtoSchema),
});
export type ListDto = z.infer<typeof listDtoSchema>;

export const listResponseDtoSchema = z.object({
  list: listDtoSchema,
});
export type ListResponseDto = z.infer<typeof listResponseDtoSchema>;

export const currentListDtoSchema = z.object({
  list: listDtoSchema.nullable(),
});
export type CurrentListDto = z.infer<typeof currentListDtoSchema>;

export const addItemResultDtoSchema = z.object({
  item: itemDtoSchema,
  created: z.boolean(),
});
export type AddItemResultDto = z.infer<typeof addItemResultDtoSchema>;

export const finishListResultDtoSchema = z.object({
  closedListId: z.string(),
});
export type FinishListResultDto = z.infer<typeof finishListResultDtoSchema>;

export const productUsageDtoSchema = z.object({
  name: z.string(),
  count: z.number().int(),
});
export type ProductUsageDto = z.infer<typeof productUsageDtoSchema>;

export const mostUsedDtoSchema = z.object({
  products: z.array(productUsageDtoSchema),
});
export type MostUsedDto = z.infer<typeof mostUsedDtoSchema>;

export const suggestionsDtoSchema = z.object({
  suggestions: z.array(z.string()),
});
export type SuggestionsDto = z.infer<typeof suggestionsDtoSchema>;
