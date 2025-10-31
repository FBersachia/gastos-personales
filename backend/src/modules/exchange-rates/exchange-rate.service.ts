import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreateExchangeRateDto, UpdateExchangeRateDto, GetExchangeRatesQuery } from './exchange-rate.schema';

export class ExchangeRateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Serialize an exchange rate object, ensuring Decimal fields are properly converted to strings
   */
  private serializeExchangeRate(exchangeRate: any) {
    const rateNumber = Number(exchangeRate.rate);
    return {
      ...exchangeRate,
      rate: rateNumber.toFixed(4),
    };
  }

  /**
   * Serialize multiple exchange rates
   */
  private serializeExchangeRates(exchangeRates: any[]) {
    return exchangeRates.map(er => this.serializeExchangeRate(er));
  }

  async findAll(userId: string, query: GetExchangeRatesQuery) {
    const { year, month, currency } = query;

    // Build where clause
    const where: Prisma.ExchangeRateWhereInput = {
      userId,
    };

    if (year) {
      where.year = year;
    }

    if (month) {
      where.month = month;
    }

    if (currency !== 'ALL') {
      where.currency = currency;
    }

    const exchangeRates = await this.prisma.exchangeRate.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { currency: 'asc' },
      ],
    });

    return this.serializeExchangeRates(exchangeRates);
  }

  async findById(userId: string, id: string) {
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { id, userId },
    });

    if (!exchangeRate) {
      throw new NotFoundError('Exchange rate not found');
    }

    return this.serializeExchangeRate(exchangeRate);
  }

  async findByMonthYearCurrency(userId: string, year: number, month: number, currency: string) {
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { userId, year, month, currency },
    });

    return exchangeRate ? this.serializeExchangeRate(exchangeRate) : null;
  }

  async create(userId: string, data: CreateExchangeRateDto) {
    // Check if exchange rate already exists for this month/year/currency
    const existing = await this.prisma.exchangeRate.findFirst({
      where: {
        userId,
        year: data.year,
        month: data.month,
        currency: data.currency,
      },
    });

    if (existing) {
      throw new ConflictError(
        `Exchange rate for ${data.currency} in ${data.month}/${data.year} already exists`
      );
    }

    const exchangeRate = await this.prisma.exchangeRate.create({
      data: {
        userId,
        ...data,
      },
    });

    return this.serializeExchangeRate(exchangeRate);
  }

  async update(userId: string, id: string, data: UpdateExchangeRateDto) {
    // Check if exchange rate exists and belongs to user
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { id, userId },
    });

    if (!exchangeRate) {
      throw new NotFoundError('Exchange rate not found');
    }

    const updatedExchangeRate = await this.prisma.exchangeRate.update({
      where: { id },
      data: {
        rate: data.rate,
      },
    });

    return this.serializeExchangeRate(updatedExchangeRate);
  }

  async delete(userId: string, id: string) {
    // Check if exchange rate exists and belongs to user
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { id, userId },
    });

    if (!exchangeRate) {
      throw new NotFoundError('Exchange rate not found');
    }

    await this.prisma.exchangeRate.delete({
      where: { id },
    });

    return { message: 'Exchange rate deleted successfully' };
  }

  /**
   * Get exchange rate for a specific date and currency
   * Uses the exchange rate for the month/year of the given date
   */
  async getExchangeRateForDate(userId: string, date: Date, currency: string): Promise<number> {
    if (currency === 'ARS') {
      return 1; // Base currency, no conversion needed
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed

    const exchangeRate = await this.findByMonthYearCurrency(userId, year, month, currency);

    if (!exchangeRate) {
      // Return 1 if no exchange rate is defined (will show original amount)
      return 1;
    }

    return Number(exchangeRate.rate);
  }
}
