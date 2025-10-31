import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { exchangeRateController } from './exchange-rate.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/exchange-rates - Get all exchange rates (with optional filters)
router.get('/', exchangeRateController.getAll.bind(exchangeRateController));

// GET /api/v1/exchange-rates/:id - Get exchange rate by ID
router.get('/:id', exchangeRateController.getById.bind(exchangeRateController));

// POST /api/v1/exchange-rates - Create new exchange rate
router.post('/', exchangeRateController.create.bind(exchangeRateController));

// PUT /api/v1/exchange-rates/:id - Update exchange rate
router.put('/:id', exchangeRateController.update.bind(exchangeRateController));

// DELETE /api/v1/exchange-rates/:id - Delete exchange rate
router.delete('/:id', exchangeRateController.delete.bind(exchangeRateController));

export { router as exchangeRateRouter };
