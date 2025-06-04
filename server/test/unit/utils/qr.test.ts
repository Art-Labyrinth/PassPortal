import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTicketToken, verifyTicketToken, parseQrData } from '../../../src/utils/qr.js';

// Мокаем модуль env
vi.mock('../../../src/config/env.js', () => ({
  env: {
    QR_SECRET: 'тестовый-секретный-ключ'
  }
}));

// Мокаем модуль QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('мок-qr-data-url')
  }
}));

describe('Утилиты QR-кода', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createTicketToken', () => {
    it('должен создавать валидный токен с правильным форматом', () => {
      const ticketId = 'G-123-4567';
      const token = createTicketToken(ticketId);
      
      expect(token).toBeDefined();
      
      const parts = token.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe(ticketId);
      
      // Проверяем, что timestamp - это число
      const timestamp = parseInt(parts[1]);
      expect(timestamp).not.toBeNaN();
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('verifyTicketToken', () => {
    it('должен проверять валидный токен', () => {
      const ticketId = 'G-123-4567';
      const token = createTicketToken(ticketId);
      
      const result = verifyTicketToken(token);
      
      expect(result).toBe(ticketId);
    });

    it('должен отклонять токены с неверным форматом', () => {
      const invalidToken = 'неверный-формат';
      
      const result = verifyTicketToken(invalidToken);
      
      expect(result).toBeNull();
    });

    it('должен отклонять токены с неверной подписью', () => {
      const ticketId = 'G-123-4567';
      const timestamp = Date.now();
      const invalidToken = `${ticketId}:${timestamp}:неверная-подпись`;
      
      const result = verifyTicketToken(invalidToken);
      
      expect(result).toBeNull();
    });
  });

  describe('parseQrData', () => {
    it('должен корректно парсить валидные данные QR-кода', () => {
      const ticketId = 'G-123-4567';
      const token = createTicketToken(ticketId);
      
      const result = parseQrData(token);
      
      expect(result).toBe(ticketId);
    });

    it('должен возвращать null для неверных данных QR-кода', () => {
      const invalidQrData = 'неверные-qr-данные';
      
      const result = parseQrData(invalidQrData);
      
      expect(result).toBeNull();
    });
  });
});
