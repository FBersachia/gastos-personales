import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import routes
import { authRouter } from './modules/auth/auth.routes';
import { paymentMethodRouter } from './modules/payment-methods/payment-method.routes';
import { categoryRouter } from './modules/categories/category.routes';
import { macroCategoryRouter } from './modules/macro-categories/macro-category.routes';
import { transactionRouter } from './modules/transactions/transaction.routes';
import { recurringSeriesRouter } from './modules/recurring-series/recurring-series.routes';
import { installmentRouter } from './modules/installments/installment.routes';
import importRouter from './modules/import/import.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { exchangeRateRouter } from './modules/exchange-rates/exchange-rate.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/payment-methods', paymentMethodRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/macro-categories', macroCategoryRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/recurring-series', recurringSeriesRouter);
app.use('/api/v1/installments', installmentRouter);
app.use('/api/v1/import', importRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/exchange-rates', exchangeRateRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export { app };
