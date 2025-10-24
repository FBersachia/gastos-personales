import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom AppError instances
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      errorResponse(
        error.message,
        error.code,
        error instanceof ValidationError ? error.details : undefined
      )
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json(
      errorResponse('Validation failed', 'VALIDATION_ERROR', error.errors)
    );
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return res
        .status(409)
        .json(errorResponse('Resource already exists', 'CONFLICT'));
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return res
        .status(409)
        .json(
          errorResponse(
            'Cannot delete resource with associated records',
            'FOREIGN_KEY_CONSTRAINT'
          )
        );
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json(errorResponse('Resource not found', 'NOT_FOUND'));
    }
  }

  // Default server error
  return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
}
