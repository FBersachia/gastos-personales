import { Request, Response, NextFunction } from 'express';
import { ExchangeRateService } from './exchange-rate.service';
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
  getExchangeRatesQuerySchema,
} from './exchange-rate.schema';
import { prisma } from '../../config/database';

const exchangeRateService = new ExchangeRateService(prisma);

export class ExchangeRateController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const query = getExchangeRatesQuerySchema.parse(req.query);
      const exchangeRates = await exchangeRateService.findAll(userId, query);

      res.json({
        success: true,
        data: exchangeRates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const exchangeRate = await exchangeRateService.findById(userId, id);

      res.json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createExchangeRateSchema.parse(req.body);
      const exchangeRate = await exchangeRateService.create(userId, data);

      res.status(201).json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = updateExchangeRateSchema.parse(req.body);
      const exchangeRate = await exchangeRateService.update(userId, id, data);

      res.json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await exchangeRateService.delete(userId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const exchangeRateController = new ExchangeRateController();
