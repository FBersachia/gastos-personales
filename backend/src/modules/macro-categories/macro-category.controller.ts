import { Request, Response, NextFunction } from 'express';
import { MacroCategoryService } from './macro-category.service';
import { createMacroCategorySchema, updateMacroCategorySchema } from './macro-category.schema';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/database';

const macroCategoryService = new MacroCategoryService(prisma);

export class MacroCategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const macroCategories = await macroCategoryService.findAll(userId);
      return res.json(successResponse(macroCategories));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const macroCategory = await macroCategoryService.findById(userId, id);
      return res.json(successResponse(macroCategory));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createMacroCategorySchema.parse(req.body);
      const macroCategory = await macroCategoryService.create(userId, data);
      return res.status(201).json(successResponse(macroCategory));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = updateMacroCategorySchema.parse(req.body);
      const macroCategory = await macroCategoryService.update(userId, id, data);
      return res.json(successResponse(macroCategory));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await macroCategoryService.delete(userId, id);
      return res.json(
        successResponse({
          message: 'Macro category deleted successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const macroCategoryController = new MacroCategoryController();
