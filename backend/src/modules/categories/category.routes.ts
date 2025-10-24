import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { categoryController } from './category.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/categories - List all categories
router.get('/', categoryController.getAll.bind(categoryController));

// GET /api/v1/categories/:id - Get single category
router.get('/:id', categoryController.getById.bind(categoryController));

// POST /api/v1/categories - Create category
router.post('/', categoryController.create.bind(categoryController));

// PUT /api/v1/categories/:id - Update category
router.put('/:id', categoryController.update.bind(categoryController));

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', categoryController.delete.bind(categoryController));

export { router as categoryRouter };
