import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/database';

const dashboardService = new DashboardService(prisma);

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const summary = await dashboardService.getSummary(userId);
      return res.json(successResponse(summary));
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
