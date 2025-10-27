import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreateTransactionDto, UpdateTransactionDto, GetTransactionsQuery } from './transaction.schema';

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string, query: GetTransactionsQuery) {
    const { page, limit, dateFrom, dateTo, categoryIds, paymentMethodIds, type, formato, source, seriesId } = query;

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Date filters
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Category filter
    if (categoryIds) {
      const ids = categoryIds.split(',').map(id => id.trim());
      where.categoryId = { in: ids };
    }

    // Payment method filter
    if (paymentMethodIds) {
      const ids = paymentMethodIds.split(',').map(id => id.trim());
      where.paymentId = { in: ids };
    }

    // Type filter
    if (type !== 'ALL') {
      where.type = type;
    }

    // Formato filter
    if (formato !== 'ALL') {
      where.formato = formato;
    }

    // Source filter
    if (source !== 'ALL') {
      where.source = source;
    }

    // Series filter
    if (seriesId) {
      where.seriesId = seriesId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with count
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
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
          recurringSeries: {
            select: {
              id: true,
              name: true,
              frequency: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Calculate totals (for all transactions matching filter, not just current page)
    const aggregations = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
    });

    const totalIncome = aggregations.find(a => a.type === 'INCOME')?._sum.amount || 0;
    const totalExpense = aggregations.find(a => a.type === 'EXPENSE')?._sum.amount || 0;
    const balance = Number(totalIncome) - Number(totalExpense);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalIncome: totalIncome.toString(),
        totalExpense: totalExpense.toString(),
        balance: balance.toString(),
      },
    };
  }

  async findById(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
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
        recurringSeries: {
          select: {
            id: true,
            name: true,
            frequency: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return transaction;
  }

  async create(userId: string, data: CreateTransactionDto) {
    // Verify category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Verify payment method exists and belongs to user
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: data.paymentMethodId, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    // If seriesId provided, verify it exists and belongs to user
    if (data.seriesId) {
      const series = await this.prisma.recurringSeries.findFirst({
        where: { id: data.seriesId, userId },
      });

      if (!series) {
        throw new NotFoundError('Recurring series not found');
      }
    }

    // Auto-set formato based on installments
    const formato = data.installments ? 'cuotas' : 'contado';

    return this.prisma.transaction.create({
      data: {
        userId,
        date: new Date(data.date),
        type: data.type,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        paymentId: data.paymentMethodId,
        installments: data.installments || null,
        formato,
        source: 'manual', // Manual transactions default to 'manual'
        seriesId: data.seriesId || null,
      },
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
        recurringSeries: {
          select: {
            id: true,
            name: true,
            frequency: true,
          },
        },
      },
    });
  }

  async update(userId: string, id: string, data: UpdateTransactionDto) {
    // Check if transaction exists and belongs to user
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // If updating category, verify it exists and belongs to user
    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: data.categoryId, userId },
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // If updating payment method, verify it exists and belongs to user
    if (data.paymentMethodId) {
      const paymentMethod = await this.prisma.paymentMethod.findFirst({
        where: { id: data.paymentMethodId, userId },
      });

      if (!paymentMethod) {
        throw new NotFoundError('Payment method not found');
      }
    }

    // If updating series, verify it exists and belongs to user
    if (data.seriesId !== undefined && data.seriesId !== null) {
      const series = await this.prisma.recurringSeries.findFirst({
        where: { id: data.seriesId, userId },
      });

      if (!series) {
        throw new NotFoundError('Recurring series not found');
      }
    }

    const updateData: any = {};
    if (data.date) updateData.date = new Date(data.date);
    if (data.type) updateData.type = data.type;
    if (data.description) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.paymentMethodId) updateData.paymentId = data.paymentMethodId;
    if (data.installments !== undefined) {
      updateData.installments = data.installments;
      // Auto-update formato when installments change
      updateData.formato = data.installments ? 'cuotas' : 'contado';
    }
    if (data.seriesId !== undefined) updateData.seriesId = data.seriesId;

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
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
        recurringSeries: {
          select: {
            id: true,
            name: true,
            frequency: true,
          },
        },
      },
    });
  }

  async delete(userId: string, id: string) {
    // Check if transaction exists and belongs to user
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    await this.prisma.transaction.delete({
      where: { id },
    });
  }
}
