import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreateTransactionDto, UpdateTransactionDto, GetTransactionsQuery } from './transaction.schema';
import { ExchangeRateService } from '../exchange-rates/exchange-rate.service';

export class TransactionService {
  private exchangeRateService: ExchangeRateService;

  constructor(private prisma: PrismaClient) {
    this.exchangeRateService = new ExchangeRateService(prisma);
  }

  /**
   * Serialize a transaction object, ensuring Decimal fields are properly converted to strings
   * Also includes ARS equivalent for USD transactions
   */
  private async serializeTransaction(transaction: any, userId: string) {
    // Convert Decimal to number first, then to string to avoid precision issues
    const amountNumber = Number(transaction.amount);

    // Get exchange rate if currency is not ARS
    let amountARS = amountNumber;
    let exchangeRate = 1;

    if (transaction.currency && transaction.currency !== 'ARS') {
      exchangeRate = await this.exchangeRateService.getExchangeRateForDate(
        userId,
        new Date(transaction.date),
        transaction.currency
      );
      amountARS = amountNumber * exchangeRate;
    }

    return {
      ...transaction,
      amount: amountNumber.toFixed(2),
      amountARS: amountARS.toFixed(2),
      exchangeRate: exchangeRate.toFixed(4),
    };
  }

  /**
   * Serialize multiple transactions
   */
  private async serializeTransactions(transactions: any[], userId: string) {
    return Promise.all(transactions.map(t => this.serializeTransaction(t, userId)));
  }

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
    // Note: Summary totals use ARS-converted amounts for accurate calculations
    const allTransactions = await this.prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
        currency: true,
        date: true,
      },
    });

    let totalIncomeARS = 0;
    let totalExpenseARS = 0;

    for (const txn of allTransactions) {
      const amount = Number(txn.amount);
      let amountARS = amount;

      if (txn.currency && txn.currency !== 'ARS') {
        const rate = await this.exchangeRateService.getExchangeRateForDate(
          userId,
          new Date(txn.date),
          txn.currency
        );
        amountARS = amount * rate;
      }

      if (txn.type === 'INCOME') {
        totalIncomeARS += amountARS;
      } else {
        totalExpenseARS += amountARS;
      }
    }

    const balance = totalIncomeARS - totalExpenseARS;

    return {
      data: await this.serializeTransactions(transactions, userId),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalIncome: totalIncomeARS.toFixed(2),
        totalExpense: totalExpenseARS.toFixed(2),
        balance: balance.toFixed(2),
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

    return this.serializeTransaction(transaction, userId);
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

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        date: new Date(data.date),
        type: data.type,
        description: data.description,
        amount: data.amount,
        currency: data.currency || 'ARS',
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

    return this.serializeTransaction(transaction, userId);
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
    if (data.currency) updateData.currency = data.currency;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.paymentMethodId) updateData.paymentId = data.paymentMethodId;
    if (data.installments !== undefined) {
      updateData.installments = data.installments;
      // Auto-update formato when installments change
      updateData.formato = data.installments ? 'cuotas' : 'contado';
    }
    if (data.seriesId !== undefined) updateData.seriesId = data.seriesId;

    const updatedTransaction = await this.prisma.transaction.update({
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

    return this.serializeTransaction(updatedTransaction, userId);
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

  async getMatchHistory(userId: string, filters?: { result?: string; dateFrom?: string; dateTo?: string }) {
    // First, find the "deporte" category for this user
    const deporteCategory = await this.prisma.category.findFirst({
      where: {
        userId,
        name: {
          contains: 'deporte',
          mode: 'insensitive',
        },
      },
    });

    // If no deporte category found, return empty results
    if (!deporteCategory) {
      return {
        matches: [],
        statistics: {
          totalMatches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winPercentage: '0',
          totalAmount: '0',
        },
      };
    }

    // Build where clause for match transactions
    const where: Prisma.TransactionWhereInput = {
      userId,
      categoryId: deporteCategory.id,
    };

    // Build OR condition for match keywords based on filter
    if (filters?.result && filters.result !== 'ALL') {
      // If specific result is selected, only search for that keyword
      where.description = {
        contains: filters.result.toLowerCase(),
        mode: 'insensitive',
      };
    } else {
      // If no specific result filter, search for all three keywords
      where.OR = [
        { description: { contains: 'perdido', mode: 'insensitive' } },
        { description: { contains: 'ganado', mode: 'insensitive' } },
        { description: { contains: 'empatado', mode: 'insensitive' } },
      ];
    }

    // Apply date filters
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(filters.dateTo);
      }
    }

    // Fetch all matches
    const matches = await this.prisma.transaction.findMany({
      where,
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

    // Parse result from description and serialize
    const matchesWithResult = await Promise.all(
      matches.map(async (match) => {
        let result = 'unknown';
        const desc = match.description.toLowerCase();
        if (desc.includes('ganado')) result = 'ganado';
        else if (desc.includes('perdido')) result = 'perdido';
        else if (desc.includes('empatado')) result = 'empatado';

        const serialized = await this.serializeTransaction(match, userId);
        return {
          ...serialized,
          result,
        };
      })
    );

    // Calculate statistics (use amountARS for accurate totals)
    const totalMatches = matchesWithResult.length;
    const wins = matchesWithResult.filter((m) => m.result === 'ganado').length;
    const losses = matchesWithResult.filter((m) => m.result === 'perdido').length;
    const draws = matchesWithResult.filter((m) => m.result === 'empatado').length;
    const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : '0';
    const totalAmount = matchesWithResult.reduce((sum, m) => sum + Number(m.amountARS), 0);

    return {
      matches: matchesWithResult,
      statistics: {
        totalMatches,
        wins,
        losses,
        draws,
        winPercentage,
        totalAmount: totalAmount.toFixed(2),
      },
    };
  }
}
