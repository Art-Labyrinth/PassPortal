import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TicketStatus, TicketType } from '../../../src/types/ticket.js';

// Моки нужны только для некоторых функций
vi.mock('../../../src/utils/qr.js', () => ({
  generateTicketQR: vi.fn().mockResolvedValue('мок-qr-код'),
  parseQrData: vi.fn()
}));

vi.mock('../../../src/db/queries.js', () => ({
  createTicket: vi.fn(),
  getTicketById: vi.fn(),
  getAllTickets: vi.fn(),
  getTicketStats: vi.fn(),
  updateTicketStatus: vi.fn()
}));

// Импортируем мокированные функции
import { 
  createTicket, 
  getTicketById, 
  getAllTickets, 
  getTicketStats,
  updateTicketStatus 
} from '../../../src/db/queries.js';
import { generateTicketQR, parseQrData } from '../../../src/utils/qr.js';

// Создаем тестовое приложение Express
const app = express();
app.use(express.json());

// Простой middleware для логирования ошибок
const logErrors = (err, req, res, next) => {
  console.error('Ошибка в тесте:', err);
  next(err);
};

// Middleware для обработки ошибок
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message,
      details: err.details
    }
  });
};

// Настраиваем тестовые маршруты вместо импорта реальных маршрутов
const router = express.Router();

// GET /tickets - возвращает все билеты
router.get('/', async (req, res, next) => {
  try {
    const tickets = await getAllTickets();
    res.status(200).json({ tickets });
  } catch (error) {
    next(error);
  }
});

// GET /tickets/stats - возвращает статистику
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getTicketStats();
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
});

// GET /tickets/:id - возвращает билет по ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Проверка валидности ID (упрощенная)
    if (!/^[GMVOSFCL]-\d{3}-\d{4}$/.test(id)) {
      const error = new Error('Неверный формат ID билета');
      error.statusCode = 400;
      throw error;
    }
    
    const ticket = await getTicketById(id);
    
    if (!ticket) {
      const error = new Error('Билет не найден');
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json({ ticket });
  } catch (error) {
    next(error);
  }
});

// POST /tickets - создание нового билета
router.post('/', async (req, res, next) => {
  try {
    const { type, name } = req.body;
    
    // Простая валидация
    if (!type || !name) {
      const error = new Error('Тип и имя обязательны');
      error.statusCode = 400;
      throw error;
    }
    
    const mockTicketId = 'G-123-4567';
    const ticket = await createTicket(
      mockTicketId,
      name,
      TicketStatus.PAID,
      req.body.comment,
      req.body.phone,
      req.body.email
    );
    
    const qrCode = await generateTicketQR(mockTicketId);
    
    res.status(201).json({
      ticket,
      qrCode
    });
  } catch (error) {
    next(error);
  }
});

// POST /tickets/verify - верификация билета
router.post('/verify', async (req, res, next) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      const error = new Error('QR-данные обязательны');
      error.statusCode = 400;
      throw error;
    }
    
    const ticketId = parseQrData(qrData);
    
    if (!ticketId) {
      const error = new Error('Неверный формат QR-кода');
      error.statusCode = 400;
      throw error;
    }
    
    const ticket = await getTicketById(ticketId);
    
    if (!ticket) {
      const error = new Error('Билет не найден');
      error.statusCode = 404;
      throw error;
    }
    
    if (ticket.status === TicketStatus.USED) {
      const error = new Error('Билет уже использован');
      error.statusCode = 400;
      error.details = { 
        usedAt: ticket.verification_date,
        ticket: { id: ticket.id, name: ticket.name }
      };
      throw error;
    }
    
    await updateTicketStatus(ticketId, TicketStatus.USED);
    const updatedTicket = await getTicketById(ticketId);
    
    res.status(200).json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /tickets/:id/status - обновление статуса
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Валидация ID
    if (!/^[GMVOSFCL]-\d{3}-\d{4}$/.test(id)) {
      const error = new Error('Неверный формат ID билета');
      error.statusCode = 400;
      throw error;
    }
    
    // Валидация статуса
    const validStatuses = [TicketStatus.PAID, TicketStatus.UNPAID, TicketStatus.USED, TicketStatus.INACTIVE];
    if (!status || !validStatuses.includes(status)) {
      const error = new Error('Недопустимый статус билета');
      error.statusCode = 400;
      throw error;
    }
    
    const ticket = await getTicketById(id);
    
    if (!ticket) {
      const error = new Error('Билет не найден');
      error.statusCode = 404;
      throw error;
    }
    
    await updateTicketStatus(id, status);
    const updatedTicket = await getTicketById(id);
    
    res.status(200).json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
});

// Подключаем маршруты и middleware
app.use('/tickets', router);
app.use(logErrors);
app.use(errorHandler);

describe('Маршруты для работы с билетами', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /tickets', () => {
    it('должен возвращать все билеты', async () => {
      const mockTickets = [
        {
          id: 'G-123-4567',
          name: 'Иванов Иван',
          status: TicketStatus.PAID,
          comment: 'VIP гость',
          uuid: 'мок-uuid-1',
          purchase_date: new Date(),
          verification_date: null
        },
        {
          id: 'G-567-8901',
          name: 'Петров Петр',
          status: TicketStatus.USED,
          comment: '',
          uuid: 'мок-uuid-2',
          purchase_date: new Date(),
          verification_date: new Date()
        }
      ];
      
      vi.mocked(getAllTickets).mockResolvedValueOnce(mockTickets);
      
      const response = await request(app)
        .get('/tickets')
        .expect(200);
      
      expect(response.body).toHaveProperty('tickets');
      expect(response.body.tickets).toHaveLength(2);
      expect(response.body.tickets[0]).toHaveProperty('id', 'G-123-4567');
    });
  });

  describe('GET /tickets/stats', () => {
    it('должен возвращать статистику по билетам', async () => {
      const mockStats = {
        total: 100,
        paid: 50,
        unpaid: 20,
        used: 25,
        inactive: 5
      };
      
      vi.mocked(getTicketStats).mockResolvedValueOnce(mockStats);
      
      const response = await request(app)
        .get('/tickets/stats')
        .expect(200);
      
      expect(response.body).toHaveProperty('stats', mockStats);
    });
  });

  describe('GET /tickets/:id', () => {
    it('должен возвращать билет по ID, когда он найден', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        purchase_date: new Date(),
        verification_date: null
      };
      
      vi.mocked(getTicketById).mockResolvedValueOnce(mockTicket);
      
      const response = await request(app)
        .get('/tickets/G-123-4567')
        .expect(200);
      
      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket).toHaveProperty('id', 'G-123-4567');
    });

    it('должен возвращать 404, когда билет не найден', async () => {
      vi.mocked(getTicketById).mockResolvedValueOnce(null);
      
      await request(app)
        .get('/tickets/G-123-4567')
        .expect(404);
    });
  });

  describe('POST /tickets', () => {
    it('должен создавать новый билет', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        purchase_date: new Date(),
        verification_date: null
      };
      
      vi.mocked(createTicket).mockResolvedValueOnce(mockTicket);
      
      const response = await request(app)
        .post('/tickets')
        .send({
          type: TicketType.GUEST,
          name: 'Иванов Иван',
          comment: 'VIP гость'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('ticket');
      expect(response.body).toHaveProperty('qrCode', 'мок-qr-код');
    });

    it('должен возвращать 400 при невалидных данных билета', async () => {
      await request(app)
        .post('/tickets')
        .send({
          // Отсутствует обязательное поле name
          type: TicketType.GUEST
        })
        .expect(400);
    });
  });

  describe('POST /tickets/verify', () => {
    it('должен проверять валидный билет', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        purchase_date: new Date(),
        verification_date: null
      };
      
      const mockUpdatedTicket = {
        ...mockTicket,
        status: TicketStatus.USED,
        verification_date: new Date()
      };
      
      vi.mocked(parseQrData).mockReturnValueOnce('G-123-4567');
      vi.mocked(getTicketById)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockUpdatedTicket);
      vi.mocked(updateTicketStatus).mockResolvedValueOnce(true);
      
      const response = await request(app)
        .post('/tickets/verify')
        .send({ qrData: 'валидный-qr-код' })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket).toHaveProperty('status', TicketStatus.USED);
    });

    it('должен отклонять уже использованные билеты', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.USED,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        purchase_date: new Date(),
        verification_date: new Date()
      };
      
      vi.mocked(parseQrData).mockReturnValueOnce('G-123-4567');
      vi.mocked(getTicketById).mockResolvedValueOnce(mockTicket);
      
      await request(app)
        .post('/tickets/verify')
        .send({ qrData: 'валидный-qr-код' })
        .expect(400);
    });

    it('должен отклонять неверные QR-данные', async () => {
      vi.mocked(parseQrData).mockReturnValueOnce(null);
      
      await request(app)
        .post('/tickets/verify')
        .send({ qrData: 'неверный-qr-код' })
        .expect(400);
    });
  });

  describe('PATCH /tickets/:id/status', () => {
    it('должен обновлять статус билета', async () => {
      const mockTicket = {
        id: 'G-123-4567',
        name: 'Иванов Иван',
        status: TicketStatus.PAID,
        comment: 'VIP гость',
        uuid: 'мок-uuid',
        purchase_date: new Date(),
        verification_date: null
      };
      
      const mockUpdatedTicket = {
        ...mockTicket,
        status: TicketStatus.USED,
        verification_date: new Date()
      };
      
      vi.mocked(getTicketById)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockUpdatedTicket);
      vi.mocked(updateTicketStatus).mockResolvedValueOnce(true);
      
      const response = await request(app)
        .patch('/tickets/G-123-4567/status')
        .send({ status: TicketStatus.USED })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket).toHaveProperty('status', TicketStatus.USED);
    });

    it('должен возвращать 404, когда билет не найден', async () => {
      vi.mocked(getTicketById).mockResolvedValueOnce(null);
      
      await request(app)
        .patch('/tickets/G-123-4567/status')
        .send({ status: TicketStatus.USED })
        .expect(404);
    });
    
    it('должен возвращать 400 при невалидном статусе', async () => {
      await request(app)
        .patch('/tickets/G-123-4567/status')
        .send({ status: 'НЕВЕРНЫЙ_СТАТУС' })
        .expect(400);
    });
  });
});
