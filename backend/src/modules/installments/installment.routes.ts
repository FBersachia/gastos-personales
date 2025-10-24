import { Router } from 'express';
import { InstallmentController } from './installment.controller';
import { InstallmentService } from './installment.service';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';

const router = Router();
const installmentService = new InstallmentService(prisma);
const installmentController = new InstallmentController(installmentService);

// All routes require authentication
router.use(authenticate);

// GET /api/v1/installments/pending - Get all pending installments
router.get('/pending', installmentController.getPendingInstallments);

export { router as installmentRouter };
