import { Router } from 'express';
import { AuthenticatedRequest, authenticate } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';
import { 
  createTicket, 
  getTicketById, 
  getAllTickets, 
  updateTicketStatus,
  getTicketStats
} from '../db/queries.js';
import { 
  generateUniqueTicketId, 
  validateTicketId,
  parseTicketTypeFromId
} from '../utils/helpers.js';
import { 
  validateTicketCreation, 
  sanitizeTicketData 
} from '../utils/validation.js';
import { 
  generateTicketQR, 
  parseQrData 
} from '../utils/qr.js';
import { TicketStatus, TicketType } from '../types/ticket.js';
import { ERROR_MESSAGES } from '../config/constants.js';

const router = Router();

// Получение всех билетов (только для администраторов)
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Проверяем, что пользователь - администратор
    if (req.user?.role !== 'admin') {
      const error: AppError = new Error('Недостаточно прав для выполнения данного действия');
      error.statusCode = 403;
      throw error;
    }
    
    const tickets = await getAllTickets();
    res.status(200).json({ tickets });
  } catch (error) {
    next(error);
  }
});

// Получение статистики по билетам
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await getTicketStats();
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
});

// Получение билета по ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validateTicketId(id)) {
      const error: AppError = new Error(ERROR_MESSAGES.INVALID_TICKET_ID);
      error.statusCode = 400;
      throw error;
    }
    
    const ticket = await getTicketById(id);
    
    if (!ticket) {
      const error: AppError = new Error(ERROR_MESSAGES.TICKET_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Создание нового билета
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Сначала валидация
    const validation = validateTicketCreation(req.body);
    
    if (!validation.valid) {
      const error: AppError = new Error('Ошибка валидации данных билета');
      error.statusCode = 400;
      error.details = { errors: validation.errors };
      throw error;
    }
    
    // Если валидация пройдена, обрабатываем данные
    const ticketData = sanitizeTicketData(req.body);
    const ticketId = await generateUniqueTicketId(ticketData.type);
    
    const ticket = await createTicket(
      ticketId,
      ticketData.name,
      ticketData.status || TicketStatus.PAID,
      ticketData.comment,
      ticketData.phone,
      ticketData.email
    );
    
    // Генерация QR-кода для билета только если билет успешно создан
    if (!ticket || !ticket.id) {
      const error: AppError = new Error('Не удалось создать билет');
      error.statusCode = 500;
      throw error;
    }
    
    const qrCode = await generateTicketQR(ticket.id);
    
    res.status(201).json({
      ticket,
      qrCode
    });
  } catch (error) {
    next(error);
  }
});

// Верификация билета по QR-коду
router.post('/verify', authenticate, async (req, res, next) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      const error: AppError = new Error('QR-код обязателен');
      error.statusCode = 400;
      throw error;
    }
    
    // Извлечение ID билета из QR-кода
    const ticketId = parseQrData(qrData);
    
    if (!ticketId) {
      const error: AppError = new Error(ERROR_MESSAGES.INVALID_QR_DATA);
      error.statusCode = 400;
      throw error;
    }
    
    // Получение билета из базы данных
    const ticket = await getTicketById(ticketId);
    
    if (!ticket) {
      const error: AppError = new Error(ERROR_MESSAGES.TICKET_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
    
    // Проверка статуса билета
    if (ticket.status === TicketStatus.USED) {
      const error: AppError = new Error(ERROR_MESSAGES.TICKET_ALREADY_USED);
      error.statusCode = 400;
      error.details = { 
        usedAt: ticket.verification_date,
        ticket: { id: ticket.id, name: ticket.name }
      };
      throw error;
    }
    
    if (ticket.status === TicketStatus.INACTIVE) {
      const error: AppError = new Error(ERROR_MESSAGES.TICKET_INACTIVE);
      error.statusCode = 400;
      throw error;
    }
    
    // Обновление статуса билета на "использован"
    await updateTicketStatus(ticketId, TicketStatus.USED);
    
    // Получение обновленного билета
    const updatedTicket = await getTicketById(ticketId);
    
    res.status(200).json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
});

// Обновление статуса билета
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    if (!validateTicketId(id)) {
      const error: AppError = new Error(ERROR_MESSAGES.INVALID_TICKET_ID);
      error.statusCode = 400;
      throw error;
    }
    
    if (!Object.values(TicketStatus).includes(status)) {
      const error: AppError = new Error(ERROR_MESSAGES.INVALID_STATUS);
      error.statusCode = 400;
      throw error;
    }
    
    const ticket = await getTicketById(id);
    
    if (!ticket) {
      const error: AppError = new Error(ERROR_MESSAGES.TICKET_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
    
    // Обновление статуса билета
    await updateTicketStatus(id, status, comment);
    
    // Получение обновленного билета
    const updatedTicket = await getTicketById(id);
    
    res.status(200).json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
});

export default router;
