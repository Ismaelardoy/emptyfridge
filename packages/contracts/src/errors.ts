import { z } from 'zod';

export const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  code: z.string(),
  errors: z.unknown().optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
