import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../../../src/middlewares/auth.js';
import jwt from 'jsonwebtoken';

// Мокаем зависимости
vi.mock('jsonwebtoken');
vi.mock('../../../src/config/env.js', () => ({
  env: {
    JWT_SECRET: 'тестовый-секрет'
  }
}));

describe('Middleware авторизации', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен добавлять пользователя в запрос при валидном токене', () => {
    const user = { id: '123', role: 'admin' };
    const mockRequest: any = {
      headers: {
        authorization: 'Bearer валидный-токен'
      }
    };
    const mockResponse: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const nextFunction = vi.fn();
    
    vi.mocked(jwt.verify).mockReturnValueOnce(user as any);
    
    authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(jwt.verify).toHaveBeenCalledWith('валидный-токен', 'тестовый-секрет');
    expect(mockRequest.user).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('должен возвращать 401, когда токен не предоставлен', () => {
    const mockRequest: any = {
      headers: {}
    };
    const mockResponse: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const nextFunction = vi.fn();
    
    authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Требуется токен аутентификации'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('должен возвращать 401, когда формат токена недействителен', () => {
    const mockRequest: any = {
      headers: {
        authorization: 'неверный-формат'
      }
    };
    const mockResponse: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const nextFunction = vi.fn();
    
    authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Неверный формат токена'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('должен возвращать 401, когда токен недействителен или истек', () => {
    const mockRequest: any = {
      headers: {
        authorization: 'Bearer недействительный-токен'
      }
    };
    const mockResponse: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const nextFunction = vi.fn();
    
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('Недействительный токен');
    });
    
    authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Недействительный или просроченный токен'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
