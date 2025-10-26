import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { dashboardController } from './dashboard.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/dashboard/summary - Get dashboard summary
router.get('/summary', dashboardController.getSummary.bind(dashboardController));

export { router as dashboardRouter };
