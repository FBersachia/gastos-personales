import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreateCategoryDto, UpdateCategoryDto } from './category.schema';

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        macroId: true,
        macroCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Transform to match API spec
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      macroCategory: cat.macroCategory,
      transactionCount: cat._count.transactions,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async findById(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        macroId: true,
        macroCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async create(userId: string, data: CreateCategoryDto) {
    // Check for duplicate name
    const existing = await this.prisma.category.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    // If macroId is provided, verify it exists and belongs to user
    if (data.macroId) {
      const macroCategory = await this.prisma.macroCategory.findFirst({
        where: {
          id: data.macroId,
          userId,
        },
      });

      if (!macroCategory) {
        throw new NotFoundError('Macro category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: data.name,
        macroId: data.macroId || null,
      },
      select: {
        id: true,
        name: true,
        macroId: true,
        macroCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateCategoryDto) {
    // Check if category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check for duplicate name (excluding current record)
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: data.name,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    // If macroId is provided, verify it exists and belongs to user
    if (data.macroId) {
      const macroCategory = await this.prisma.macroCategory.findFirst({
        where: {
          id: data.macroId,
          userId,
        },
      });

      if (!macroCategory) {
        throw new NotFoundError('Macro category not found');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        macroId: data.macroId || null,
      },
      select: {
        id: true,
        name: true,
        macroId: true,
        macroCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(userId: string, id: string) {
    // Check if category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Try to delete (will throw if constraint fails)
    try {
      await this.prisma.category.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        // Foreign key constraint
        throw new ConflictError(
          'Cannot delete category with associated transactions'
        );
      }
      throw error;
    }
  }
}
