import { z } from 'zod';

export const createMacroCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
});

export const updateMacroCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
});

export type CreateMacroCategoryDto = z.infer<typeof createMacroCategorySchema>;
export type UpdateMacroCategoryDto = z.infer<typeof updateMacroCategorySchema>;
