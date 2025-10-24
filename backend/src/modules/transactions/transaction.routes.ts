import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { transactionController } from './transaction.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/transactions - List all transactions with filters and pagination
router.get('/', transactionController.getAll.bind(transactionController));

// GET /api/v1/transactions/:id - Get single transaction
router.get('/:id', transactionController.getById.bind(transactionController));

// POST /api/v1/transactions - Create transaction
router.post('/', transactionController.create.bind(transactionController));

// PUT /api/v1/transactions/:id - Update transaction
router.put('/:id', transactionController.update.bind(transactionController));

// DELETE /api/v1/transactions/:id - Delete transaction
router.delete('/:id', transactionController.delete.bind(transactionController));

export { router as transactionRouter };
