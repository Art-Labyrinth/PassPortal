import { Request, Response, NextFunction } from 'express';

// Интерфейс для расширенных ошибок
export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

// Middleware для обработки ошибок
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: {
      message: err.message,
      details: err.details
    }
  });
}

// Middleware для обработки несуществующих маршрутов
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Не найдено: ${req.method} ${req.path}`
    }
  });
}
