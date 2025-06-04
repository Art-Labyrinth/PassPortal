import { describe, it, expect } from 'vitest';
import { validateTicketCreation, sanitizeTicketData } from '../../../src/utils/validation.js';
import { TicketType, TicketStatus } from '../../../src/types/ticket.js';

describe('Утилиты валидации', () => {
  describe('validateTicketCreation', () => {
    it('должен валидировать корректные данные билета', () => {
      const validData = {
        type: TicketType.GUEST,
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        phone: '+79001234567',
        email: 'ivan@example.com'
      };
      
      const result = validateTicketCreation(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('должен валидировать данные билета с минимальными обязательными полями', () => {
      const validData = {
        type: TicketType.MASTER,
        name: 'Петров Петр'
      };
      
      const result = validateTicketCreation(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('должен отклонять данные без типа', () => {
      const invalidData = {
        name: 'Иванов Иван'
      };
      
      const result = validateTicketCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Тип билета обязателен');
    });

    it('должен отклонять данные с некорректным типом', () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        name: 'Иванов Иван'
      };
      
      const result = validateTicketCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Недопустимый тип билета');
    });

    it('должен отклонять данные без имени', () => {
      const invalidData = {
        type: TicketType.GUEST
      };
      
      const result = validateTicketCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Имя обязательно');
    });

    it('должен отклонять данные с пустым именем', () => {
      const invalidData = {
        type: TicketType.GUEST,
        name: '   '
      };
      
      const result = validateTicketCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Имя обязательно');
    });

    it('должен отклонять данные с некорректным статусом', () => {
      const invalidData = {
        type: TicketType.GUEST,
        name: 'Иванов Иван',
        status: 'НЕВЕРНЫЙ_СТАТУС'
      };
      
      const result = validateTicketCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Недопустимый статус билета');
    });
  });

  describe('sanitizeTicketData', () => {
    it('должен правильно очищать данные билета', () => {
      const inputData = {
        type: TicketType.GUEST,
        name: '  Иванов Иван  ',
        status: TicketStatus.PAID,
        comment: '  VIP гость  ',
        phone: '  +79001234567  ',
        email: '  ivan@example.com  '
      };
      
      const sanitized = sanitizeTicketData(inputData);
      
      expect(sanitized).toEqual({
        type: TicketType.GUEST,
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        phone: '+79001234567',
        email: 'ivan@example.com'
      });
    });

    it('должен корректно обрабатывать минимальные данные', () => {
      const inputData = {
        type: TicketType.MASTER,
        name: 'Петров Петр'
      };
      
      const sanitized = sanitizeTicketData(inputData);
      
      expect(sanitized).toEqual({
        type: TicketType.MASTER,
        name: 'Петров Петр'
      });
    });
  });
});
