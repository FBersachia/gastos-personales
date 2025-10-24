import { Request, Response, NextFunction } from 'express';
import { InstallmentService } from './installment.service';
import { getPendingInstallmentsQuerySchema } from './installment.schema';
import { successResponse } from '../../utils/response';

export class InstallmentController {
  constructor(private installmentService: InstallmentService) {}

  getPendingInstallments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const query = getPendingInstallmentsQuerySchema.parse(req.query);

      const pendingInstallments = await this.installmentService.getPendingInstallments(userId, query);

      // Calculate total pending across all installments
      const totalPendingAmount = pendingInstallments.reduce(
        (sum, item) => sum + item.totalPending,
        0
      );

      return res.json(
        successResponse({
          installments: pendingInstallments,
          totalPending: totalPendingAmount,
          count: pendingInstallments.length,
        })
      );
    } catch (error) {
      next(error);
    }
  };
}
