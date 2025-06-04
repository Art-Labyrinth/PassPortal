import { describe, it, expect, vi } from 'vitest';
import { errorHandler, notFoundHandler, AppError } from '../../../src/middlewares/errorHandler.js';

describe('Middleware обработки ошибок', () => {
  describe('errorHandler', () => {
    it('должен обрабатывать ошибки с кодом статуса', () => {
      const error = new Error('Тестовая ошибка') as AppError;
      error.statusCode = 400;
      error.details = { field: 'name' };
      
      const mockRequest: any = {};
      const mockResponse: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const nextFunction = vi.fn();
      
      errorHandler(error, mockRequest, mockResponse, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Тестовая ошибка',
          details: { field: 'name' }
        }
      });
    });
    
    it('должен использовать код статуса 500 по умолчанию', () => {
      const error = new Error('Серверная ошибка') as AppError;
      
      const mockRequest: any = {};
      const mockResponse: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const nextFunction = vi.fn();
      
      errorHandler(error, mockRequest, mockResponse, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Серверная ошибка',
          details: undefined
        }
      });
    });
  });
  
  describe('notFoundHandler', () => {
    it('должен возвращать 404 с информацией о пути', () => {
      const mockRequest: any = {
        method: 'GET',
        path: '/неверный/путь'
      };
      const mockResponse: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      
      notFoundHandler(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Не найдено: GET /неверный/путь'
        }
      });
    });
  });
});
