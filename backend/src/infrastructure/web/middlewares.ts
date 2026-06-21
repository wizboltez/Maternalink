import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { z } from 'zod';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'mother' | 'doctor' | 'admin';
  };
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      role: 'mother' | 'doctor' | 'admin';
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
};

/**
 * Zod Request Schema Validator
 */
export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Bind parsed data back
  req.body = result.data.body;
  req.query = result.data.query;
  req.params = result.data.params;
  next();
};

/**
 * Global HTTP Error Handler
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Error caught by middleware:', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(status).json({
    error: message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
