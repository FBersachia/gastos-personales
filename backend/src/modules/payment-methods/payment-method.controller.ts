import { Request, Response, NextFunction } from 'express';
import { PaymentMethodService } from './payment-method.service';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from './payment-method.schema';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/database';

const paymentMethodService = new PaymentMethodService(prisma);

export class PaymentMethodController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const paymentMethods = await paymentMethodService.findAll(userId);
      return res.json(successResponse(paymentMethods));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const paymentMethod = await paymentMethodService.findById(userId, id);
      return res.json(successResponse(paymentMethod));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createPaymentMethodSchema.parse(req.body);
      const paymentMethod = await paymentMethodService.create(userId, data);
      return res.status(201).json(successResponse(paymentMethod));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = updatePaymentMethodSchema.parse(req.body);
      const paymentMethod = await paymentMethodService.update(userId, id, data);
      return res.json(successResponse(paymentMethod));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await paymentMethodService.delete(userId, id);
      return res.json(
        successResponse({
          message: 'Payment method deleted successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const paymentMethodController = new PaymentMethodController();
