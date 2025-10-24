import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './payment-method.schema';

export class PaymentMethodService {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(userId: string, id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    return paymentMethod;
  }

  async create(userId: string, data: CreatePaymentMethodDto) {
    // Check for duplicate name
    const existing = await this.prisma.paymentMethod.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Payment method with this name already exists');
    }

    return this.prisma.paymentMethod.create({
      data: {
        userId,
        name: data.name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, id: string, data: UpdatePaymentMethodDto) {
    // Check if payment method exists and belongs to user
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    // Check for duplicate name (excluding current record)
    const existing = await this.prisma.paymentMethod.findFirst({
      where: {
        userId,
        name: data.name,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ConflictError('Payment method with this name already exists');
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: { name: data.name },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(userId: string, id: string) {
    // Check if payment method exists and belongs to user
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    // Try to delete (will throw if constraint fails)
    try {
      await this.prisma.paymentMethod.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        // Foreign key constraint
        throw new ConflictError(
          'Cannot delete payment method with associated transactions'
        );
      }
      throw error;
    }
  }
}
