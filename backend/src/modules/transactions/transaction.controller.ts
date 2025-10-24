import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service';
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from './transaction.schema';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/database';

const transactionService = new TransactionService(prisma);

export class TransactionController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const query = getTransactionsQuerySchema.parse(req.query);
      const result = await transactionService.findAll(userId, query);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const transaction = await transactionService.findById(userId, id);
      return res.json(successResponse(transaction));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createTransactionSchema.parse(req.body);
      const transaction = await transactionService.create(userId, data);
      return res.status(201).json(successResponse(transaction));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = updateTransactionSchema.parse(req.body);
      const transaction = await transactionService.update(userId, id, data);
      return res.json(successResponse(transaction));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await transactionService.delete(userId, id);
      return res.json(
        successResponse({
          message: 'Transaction deleted successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
