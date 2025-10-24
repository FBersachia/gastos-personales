import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { CreateMacroCategoryDto, UpdateMacroCategoryDto } from './macro-category.schema';

export class MacroCategoryService {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string) {
    const macroCategories = await this.prisma.macroCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            categories: true,
          },
        },
      },
    });

    // Transform to match API spec
    return macroCategories.map(macro => ({
      id: macro.id,
      name: macro.name,
      categoryCount: macro._count.categories,
      createdAt: macro.createdAt,
      updatedAt: macro.updatedAt,
    }));
  }

  async findById(userId: string, id: string) {
    const macroCategory = await this.prisma.macroCategory.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            categories: true,
          },
        },
      },
    });

    if (!macroCategory) {
      throw new NotFoundError('Macro category not found');
    }

    return {
      id: macroCategory.id,
      name: macroCategory.name,
      categoryCount: macroCategory._count.categories,
      createdAt: macroCategory.createdAt,
      updatedAt: macroCategory.updatedAt,
    };
  }

  async create(userId: string, data: CreateMacroCategoryDto) {
    // Check for duplicate name
    const existing = await this.prisma.macroCategory.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Macro category with this name already exists');
    }

    return this.prisma.macroCategory.create({
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

  async update(userId: string, id: string, data: UpdateMacroCategoryDto) {
    // Check if macro category exists and belongs to user
    const macroCategory = await this.prisma.macroCategory.findFirst({
      where: { id, userId },
    });

    if (!macroCategory) {
      throw new NotFoundError('Macro category not found');
    }

    // Check for duplicate name (excluding current record)
    const existing = await this.prisma.macroCategory.findFirst({
      where: {
        userId,
        name: data.name,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ConflictError('Macro category with this name already exists');
    }

    return this.prisma.macroCategory.update({
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
    // Check if macro category exists and belongs to user
    const macroCategory = await this.prisma.macroCategory.findFirst({
      where: { id, userId },
    });

    if (!macroCategory) {
      throw new NotFoundError('Macro category not found');
    }

    // Delete (categories will be set to null automatically due to onDelete: SetNull)
    await this.prisma.macroCategory.delete({
      where: { id },
    });
  }
}
