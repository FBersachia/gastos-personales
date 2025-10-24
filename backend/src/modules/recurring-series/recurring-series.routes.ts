import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { recurringSeriesController } from './recurring-series.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/recurring-series - List all recurring series
router.get('/', recurringSeriesController.getAll.bind(recurringSeriesController));

// GET /api/v1/recurring-series/:id - Get single series
router.get('/:id', recurringSeriesController.getById.bind(recurringSeriesController));

// GET /api/v1/recurring-series/:id/transactions - Get series transactions
router.get('/:id/transactions', recurringSeriesController.getTransactions.bind(recurringSeriesController));

// POST /api/v1/recurring-series - Create series
router.post('/', recurringSeriesController.create.bind(recurringSeriesController));

// PUT /api/v1/recurring-series/:id - Update series
router.put('/:id', recurringSeriesController.update.bind(recurringSeriesController));

// DELETE /api/v1/recurring-series/:id - Delete series
router.delete('/:id', recurringSeriesController.delete.bind(recurringSeriesController));

export { router as recurringSeriesRouter };
