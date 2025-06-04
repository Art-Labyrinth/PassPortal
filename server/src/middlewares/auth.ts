import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Расширение интерфейса для добавления пользователя в запрос
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware для проверки JWT токена
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Требуется токен аутентификации' });
    return;
  }
  
  const tokenParts = authHeader.split(' ');
  
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Неверный формат токена' });
    return;
  }
  
  const token = tokenParts[1];
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    (req as AuthenticatedRequest).user = decoded as { id: string; role: string };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
}
