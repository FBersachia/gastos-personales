import { PrismaClient, Prisma } from '@prisma/client';
import { DashboardSummary } from './dashboard.schema';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getSummary(userId: string): Promise<DashboardSummary> {
    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Build where clause for current month
    const currentMonthWhere: Prisma.TransactionWhereInput = {
      userId,
      date: {
        gte: currentMonthStart,
        lte: currentMonthEnd,
      },
    };

    // Build where clause for previous month
    const previousMonthWhere: Prisma.TransactionWhereInput = {
      userId,
      date: {
        gte: previousMonthStart,
        lte: previousMonthEnd,
      },
    };

    // Fetch current month transactions
    const currentMonthTransactions = await this.prisma.transaction.findMany({
      where: currentMonthWhere,
      select: {
        amount: true,
        type: true,
      },
    });

    // Fetch previous month transactions
    const previousMonthTransactions = await this.prisma.transaction.findMany({
      where: previousMonthWhere,
      select: {
        amount: true,
        type: true,
      },
    });

    // Calculate current month totals
    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate previous month totals
    const previousMonthIncome = previousMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousMonthExpenses = previousMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Get top spending categories (current month, expenses only)
    const topCategoriesRaw = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        type: 'EXPENSE',
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Filter out transactions without category
    const topCategoriesFiltered = topCategoriesRaw.filter(t => t.categoryId !== null);

    // Group and aggregate manually
    const categoryAggregates = new Map<string, { amount: number; count: number }>();
    topCategoriesFiltered.forEach(t => {
      if (t.categoryId) {
        const existing = categoryAggregates.get(t.categoryId) || { amount: 0, count: 0 };
        existing.amount += Number(t.amount);
        existing.count += 1;
        categoryAggregates.set(t.categoryId, existing);
      }
    });

    // Sort by amount and take top 5
    const topCategoriesData = Array.from(categoryAggregates.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        _sum: { amount: data.amount },
        _count: { id: data.count },
      }))
      .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
      .slice(0, 5);

    // Fetch category details
    const categoryIds = topCategoriesData.map(c => c.categoryId).filter((id): id is string => id !== null);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const topCategories = topCategoriesData.map(item => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId) || 'Unknown',
      amount: item._sum.amount || 0,
      count: item._count.id,
      percentage: currentMonthExpenses > 0
        ? (item._sum.amount || 0) / currentMonthExpenses * 100
        : 0,
    }));

    // Get recent transactions (last 5)
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get pending installments
    const installmentTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        installments: { not: null },
      },
      select: {
        id: true,
        description: true,
        installments: true,
        amount: true,
      },
    });

    const pendingInstallmentItems = installmentTransactions
      .map(transaction => {
        if (!transaction.installments) return null;

        const match = transaction.installments.match(/^(\d+)\/(\d+)$/);
        if (!match) return null;

        const currentInstallment = parseInt(match[1], 10);
        const totalInstallments = parseInt(match[2], 10);
        const pendingInstallments = totalInstallments - currentInstallment;

        if (pendingInstallments <= 0) return null;

        const totalAmount = Number(transaction.amount);
        const amountPerInstallment = totalAmount / totalInstallments;
        const totalPending = amountPerInstallment * pendingInstallments;

        return {
          transactionId: transaction.id,
          description: transaction.description,
          pendingInstallments,
          totalPending,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalPendingAmount = pendingInstallmentItems.reduce((sum, item) => sum + item.totalPending, 0);

    // Build summary
    console.log('[DASHBOARD] Building summary response');
    const summary: DashboardSummary = {
      currentMonth: {
        totalIncome: currentMonthIncome,
        totalExpenses: currentMonthExpenses,
        balance: currentMonthIncome - currentMonthExpenses,
        transactionCount: currentMonthTransactions.length,
      },
      previousMonth: {
        totalIncome: previousMonthIncome,
        totalExpenses: previousMonthExpenses,
        balance: previousMonthIncome - previousMonthExpenses,
        transactionCount: previousMonthTransactions.length,
      },
      topCategories,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        paymentMethod: t.paymentMethod,
      })),
      pendingInstallments: {
        totalCount: pendingInstallmentItems.length,
        totalAmount: totalPendingAmount,
        items: pendingInstallmentItems.slice(0, 5), // Top 5 pending
      },
    };

    console.log('[DASHBOARD] Summary built successfully');
    return summary;
  }
}
