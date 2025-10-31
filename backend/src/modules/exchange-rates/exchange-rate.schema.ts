import { z } from 'zod';

export const createExchangeRateSchema = z.object({
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2000).max(2100, 'Year must be between 2000 and 2100'),
  currency: z.enum(['USD'], {
    errorMap: () => ({ message: 'Currency must be USD (ARS is base currency)' }),
  }),
  rate: z.number().positive('Rate must be positive'),
});

export const updateExchangeRateSchema = z.object({
  rate: z.number().positive('Rate must be positive'),
});

export const getExchangeRatesQuerySchema = z.object({
  year: z.string().optional().transform((val) => val ? Number(val) : undefined),
  month: z.string().optional().transform((val) => val ? Number(val) : undefined),
  currency: z.enum(['USD', 'ALL']).optional().default('ALL'),
});

export type CreateExchangeRateDto = z.infer<typeof createExchangeRateSchema>;
export type UpdateExchangeRateDto = z.infer<typeof updateExchangeRateSchema>;
export type GetExchangeRatesQuery = z.infer<typeof getExchangeRatesQuerySchema>;
