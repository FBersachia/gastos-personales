import { z } from 'zod';

// Installments format: "n1/n2" where n1 <= n2
const installmentsRegex = /^\d+\/\d+$/;

export const createTransactionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date <= today;
  }, {
    message: 'Date cannot be in the future',
  }),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
  }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long')
    .trim(),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount is too large'),
  categoryId: z.string().uuid('Invalid category ID'),
  paymentMethodId: z.string().uuid('Invalid payment method ID'),
  installments: z
    .string()
    .regex(installmentsRegex, 'Installments must be in format n1/n2')
    .refine((val) => {
      const [current, total] = val.split('/').map(Number);
      return current <= total && current > 0 && total > 0;
    }, 'Invalid installments: current must be <= total and both must be positive')
    .nullable()
    .optional(),
  seriesId: z.string().uuid('Invalid series ID').nullable().optional(),
});

export const updateTransactionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  }, {
    message: 'Date cannot be in the future',
  }).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  description: z.string().min(1).max(500).trim().optional(),
  amount: z.number().positive().max(999999999.99).optional(),
  categoryId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  installments: z
    .string()
    .regex(installmentsRegex)
    .refine((val) => {
      const [current, total] = val.split('/').map(Number);
      return current <= total && current > 0 && total > 0;
    })
    .nullable()
    .optional(),
  seriesId: z.string().uuid().nullable().optional(),
});

export const getTransactionsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('25').transform(Number).refine((val) => val <= 100, {
    message: 'Limit cannot exceed 100',
  }),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryIds: z.string().optional(), // comma-separated UUIDs
  paymentMethodIds: z.string().optional(), // comma-separated UUIDs
  type: z.enum(['INCOME', 'EXPENSE', 'ALL']).optional().default('ALL'),
  formato: z.enum(['cuotas', 'contado', 'ALL']).optional().default('ALL'),
  source: z.enum(['csv', 'pdf', 'manual', 'ALL']).optional().default('ALL'),
  seriesId: z.string().uuid().optional(),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
