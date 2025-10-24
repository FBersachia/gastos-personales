import { z } from 'zod';

export const createRecurringSeriesSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
  frequency: z
    .string()
    .min(1, 'Frequency is required')
    .max(50, 'Frequency is too long')
    .trim(),
});

export const updateRecurringSeriesSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  frequency: z.string().min(1).max(50).trim().optional(),
});

export type CreateRecurringSeriesDto = z.infer<typeof createRecurringSeriesSchema>;
export type UpdateRecurringSeriesDto = z.infer<typeof updateRecurringSeriesSchema>;
