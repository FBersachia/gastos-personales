import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreateRecurringSeriesDto, UpdateRecurringSeriesDto } from './recurring-series.schema';

export class RecurringSeriesService {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string) {
    const series = await this.prisma.recurringSeries.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        frequency: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
          },
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            date: true,
            amount: true,
          },
        },
      },
    });

    // Calculate statistics for each series
    const seriesWithStats = await Promise.all(
      series.map(async (s) => {
        const stats = await this.prisma.transaction.aggregate({
          where: {
            seriesId: s.id,
            userId,
          },
          _avg: {
            amount: true,
          },
          _sum: {
            amount: true,
          },
        });

        return {
          id: s.id,
          name: s.name,
          frequency: s.frequency,
          transactionCount: s._count.transactions,
          lastTransaction: s.transactions[0] || null,
          averageAmount: stats._avg.amount?.toString() || '0',
          totalAmount: stats._sum.amount?.toString() || '0',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      })
    );

    return seriesWithStats;
  }

  async findById(userId: string, id: string) {
    const series = await this.prisma.recurringSeries.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        frequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!series) {
      throw new NotFoundError('Recurring series not found');
    }

    return series;
  }

  async findTransactionsBySeries(userId: string, seriesId: string) {
    // Verify series exists and belongs to user
    const series = await this.prisma.recurringSeries.findFirst({
      where: { id: seriesId, userId },
    });

    if (!series) {
      throw new NotFoundError('Recurring series not found');
    }

    // Get all transactions for this series
    const transactions = await this.prisma.transaction.findMany({
      where: {
        seriesId,
        userId,
      },
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
      },
    });

    // Calculate summary statistics
    const stats = await this.prisma.transaction.aggregate({
      where: {
        seriesId,
        userId,
      },
      _count: true,
      _sum: {
        amount: true,
      },
      _avg: {
        amount: true,
      },
    });

    return {
      series: {
        id: series.id,
        name: series.name,
        frequency: series.frequency,
      },
      transactions,
      summary: {
        count: stats._count,
        total: stats._sum.amount?.toString() || '0',
        average: stats._avg.amount?.toString() || '0',
      },
    };
  }

  async create(userId: string, data: CreateRecurringSeriesDto) {
    // Check for duplicate name
    const existing = await this.prisma.recurringSeries.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Recurring series with this name already exists');
    }

    return this.prisma.recurringSeries.create({
      data: {
        userId,
        name: data.name,
        frequency: data.frequency,
      },
      select: {
        id: true,
        name: true,
        frequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateRecurringSeriesDto) {
    // Check if series exists and belongs to user
    const series = await this.prisma.recurringSeries.findFirst({
      where: { id, userId },
    });

    if (!series) {
      throw new NotFoundError('Recurring series not found');
    }

    // If updating name, check for duplicate
    if (data.name) {
      const existing = await this.prisma.recurringSeries.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Recurring series with this name already exists');
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.frequency) updateData.frequency = data.frequency;

    return this.prisma.recurringSeries.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        frequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(userId: string, id: string) {
    // Check if series exists and belongs to user
    const series = await this.prisma.recurringSeries.findFirst({
      where: { id, userId },
    });

    if (!series) {
      throw new NotFoundError('Recurring series not found');
    }

    // Delete series (transactions will have seriesId set to null due to onDelete: SetNull)
    await this.prisma.recurringSeries.delete({
      where: { id },
    });
  }
}
