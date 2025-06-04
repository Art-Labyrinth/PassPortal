import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTicket,
  getTicketById,
  getTicketByUuid,
  updateTicketStatus,
  getAllTickets,
  checkTicketIdExists,
  getTicketStats
} from '../../../src/db/queries.js';
import { TicketStatus, TicketType } from '../../../src/types/ticket.js';

// Мокаем пул соединений с БД
vi.mock('../../../src/db/pool.js', () => ({
  default: {
    query: vi.fn()
  }
}));

// Импортируем мок для использования в тестах
import pool from '../../../src/db/pool.js';

describe('Запросы к базе данных', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('должен создавать билет и возвращать его', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        phone: '+79001234567',
        email: 'ivan@example.com',
        purchase_date: new Date().toISOString(),
        verification_date: null
      };
      
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockTicket],
        rowCount: 1
      } as any);
      
      const result = await createTicket(
        'G-123-4567',
        'Иванов Иван',
        TicketStatus.PAID,
        'VIP гость',
        '+79001234567',
        'ivan@example.com'
      );
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 'G-123-4567');
      expect(result).toHaveProperty('name', 'Иванов Иван');
      expect(result).toHaveProperty('status', TicketStatus.PAID);
    });

    it('должен создавать билет с минимальными данными', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        uuid: 'мок-uuid',
        purchase_date: new Date().toISOString(),
        verification_date: null
      };
      
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockTicket],
        rowCount: 1
      } as any);
      
      const result = await createTicket('G-123-4567', 'Иванов Иван');
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 'G-123-4567');
      expect(result).toHaveProperty('name', 'Иванов Иван');
    });
  });

  describe('getTicketById', () => {
    it('должен возвращать билет, когда он найден', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        purchase_date: new Date().toISOString(),
        verification_date: null
      };
      
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockTicket],
        rowCount: 1
      } as any);
      
      const result = await getTicketById('G-123-4567');
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 'G-123-4567');
    });

    it('должен возвращать null, когда билет не найден', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);
      
      const result = await getTicketById('G-123-4567');
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('updateTicketStatus', () => {
    it('должен обновлять статус билета', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rowCount: 1
      } as any);
      
      const result = await updateTicketStatus('G-123-4567', TicketStatus.USED);
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
      
      // Проверяем, что запрос содержит поле verification_date при статусе USED
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      expect(queryCall[0]).toContain('verification_date');
    });

    it('должен обновлять статус и комментарий', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rowCount: 1
      } as any);
      
      const result = await updateTicketStatus('G-123-4567', TicketStatus.INACTIVE, 'Отменен клиентом');
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
      
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      expect(queryCall[0]).toContain('comment');
      expect(queryCall[1]).toContain('Отменен клиентом');
    });

    it('должен возвращать false, когда билет не найден', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rowCount: 0
      } as any);
      
      const result = await updateTicketStatus('G-123-4567', TicketStatus.USED);
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });

  describe('getTicketStats', () => {
    it('должен возвращать статистику по билетам', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{
          total: '100',
          paid: '50',
          unpaid: '20',
          used: '25',
          inactive: '5'
        }]
      } as any);
      
      const stats = await getTicketStats();
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(stats).toEqual({
        total: 100,
        paid: 50,
        unpaid: 20,
        used: 25,
        inactive: 5
      });
    });
  });
  
  describe('checkTicketIdExists', () => {
    it('должен возвращать true, если билет существует', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: true }]
      } as any);
      
      const result = await checkTicketIdExists('G-123-4567');
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });
    
    it('должен возвращать false, если билет не существует', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: false }]
      } as any);
      
      const result = await checkTicketIdExists('G-123-4567');
      
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });
});
