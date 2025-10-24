import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { createCategorySchema, updateCategorySchema } from './category.schema';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/database';

const categoryService = new CategoryService(prisma);

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const categories = await categoryService.findAll(userId);
      return res.json(successResponse(categories));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const category = await categoryService.findById(userId, id);
      return res.json(successResponse(category));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createCategorySchema.parse(req.body);
      const category = await categoryService.create(userId, data);
      return res.status(201).json(successResponse(category));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = updateCategorySchema.parse(req.body);
      const category = await categoryService.update(userId, id, data);
      return res.json(successResponse(category));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await categoryService.delete(userId, id);
      return res.json(
        successResponse({
          message: 'Category deleted successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
