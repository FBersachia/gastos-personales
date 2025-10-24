import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { paymentMethodController } from './payment-method.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/payment-methods - List all payment methods
router.get('/', paymentMethodController.getAll.bind(paymentMethodController));

// GET /api/v1/payment-methods/:id - Get single payment method
router.get('/:id', paymentMethodController.getById.bind(paymentMethodController));

// POST /api/v1/payment-methods - Create payment method
router.post('/', paymentMethodController.create.bind(paymentMethodController));

// PUT /api/v1/payment-methods/:id - Update payment method
router.put('/:id', paymentMethodController.update.bind(paymentMethodController));

// DELETE /api/v1/payment-methods/:id - Delete payment method
router.delete('/:id', paymentMethodController.delete.bind(paymentMethodController));

export { router as paymentMethodRouter };
