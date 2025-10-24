import { z } from 'zod';

export const getPendingInstallmentsQuerySchema = z.object({
  sortBy: z.enum(['pending', 'amount', 'date']).optional().default('pending'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetPendingInstallmentsQuery = z.infer<typeof getPendingInstallmentsQuerySchema>;

export interface PendingInstallment {
  transactionId: string;
  description: string;
  date: Date;
  paymentMethod: {
    id: string;
    name: string;
  };
  currentInstallment: number;
  totalInstallments: number;
  pendingInstallments: number;
  totalAmount: number;
  amountPerInstallment: number;
  totalPending: number;
  estimatedEndDate: Date;
}
