import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../config/database';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Initialize service and controller
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

// Rate limiting for auth endpoints (stricter than global)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
});

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Protected routes
router.post('/logout', authenticate, authController.logout);

export { router as authRouter };
