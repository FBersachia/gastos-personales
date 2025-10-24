import { Request, Response, NextFunction } from 'express';
import { RecurringSeriesService } from './recurring-series.service';
import {
  createRecurringSeriesSchema,
  updateRecurringSeriesSchema,
} from './recurring-series.schema';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/database';

const recurringSeriesService = new RecurringSeriesService(prisma);

export class RecurringSeriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const series = await recurringSeriesService.findAll(userId);
      return res.json(successResponse(series));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const series = await recurringSeriesService.findById(userId, id);
      return res.json(successResponse(series));
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await recurringSeriesService.findTransactionsBySeries(userId, id);
      return res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createRecurringSeriesSchema.parse(req.body);
      const series = await recurringSeriesService.create(userId, data);
      return res.status(201).json(successResponse(series));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = updateRecurringSeriesSchema.parse(req.body);
      const series = await recurringSeriesService.update(userId, id, data);
      return res.json(successResponse(series));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await recurringSeriesService.delete(userId, id);
      return res.json(
        successResponse({
          message: 'Recurring series deleted successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const recurringSeriesController = new RecurringSeriesController();
