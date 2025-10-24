import { PrismaClient } from '@prisma/client';
import { GetPendingInstallmentsQuery, PendingInstallment } from './installment.schema';

export class InstallmentService {
  constructor(private prisma: PrismaClient) {}

  async getPendingInstallments(userId: string, query: GetPendingInstallmentsQuery): Promise<PendingInstallment[]> {
    // Fetch all transactions with installments for this user
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        installments: {
          not: null,
        },
      },
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Parse and calculate pending installments
    const pendingInstallments: PendingInstallment[] = transactions
      .map((transaction) => {
        if (!transaction.installments) return null;

        // Parse installments format "n1/n2"
        const match = transaction.installments.match(/^(\d+)\/(\d+)$/);
        if (!match) return null;

        const currentInstallment = parseInt(match[1], 10);
        const totalInstallments = parseInt(match[2], 10);
        const pendingInstallments = totalInstallments - currentInstallment;

        // Skip if no pending installments
        if (pendingInstallments <= 0) return null;

        const totalAmount = Number(transaction.amount);
        const amountPerInstallment = totalAmount / totalInstallments;
        const totalPending = amountPerInstallment * pendingInstallments;

        // Estimate end date (assuming monthly installments)
        const estimatedEndDate = new Date(transaction.date);
        estimatedEndDate.setMonth(estimatedEndDate.getMonth() + pendingInstallments);

        return {
          transactionId: transaction.id,
          description: transaction.description,
          date: transaction.date,
          paymentMethod: transaction.paymentMethod,
          currentInstallment,
          totalInstallments,
          pendingInstallments,
          totalAmount,
          amountPerInstallment,
          totalPending,
          estimatedEndDate,
        };
      })
      .filter((item): item is PendingInstallment => item !== null);

    // Apply sorting
    const { sortBy, order } = query;
    pendingInstallments.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'pending':
          comparison = a.pendingInstallments - b.pendingInstallments;
          break;
        case 'amount':
          comparison = a.totalPending - b.totalPending;
          break;
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return pendingInstallments;
  }
}
