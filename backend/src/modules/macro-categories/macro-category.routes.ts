import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { macroCategoryController } from './macro-category.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/macro-categories - List all macro categories
router.get('/', macroCategoryController.getAll.bind(macroCategoryController));

// GET /api/v1/macro-categories/:id - Get single macro category
router.get('/:id', macroCategoryController.getById.bind(macroCategoryController));

// POST /api/v1/macro-categories - Create macro category
router.post('/', macroCategoryController.create.bind(macroCategoryController));

// PUT /api/v1/macro-categories/:id - Update macro category
router.put('/:id', macroCategoryController.update.bind(macroCategoryController));

// DELETE /api/v1/macro-categories/:id - Delete macro category
router.delete('/:id', macroCategoryController.delete.bind(macroCategoryController));

export { router as macroCategoryRouter };
