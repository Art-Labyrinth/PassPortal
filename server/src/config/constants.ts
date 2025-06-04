import { TicketType, TicketStatus } from '../types/ticket.js';

export const TICKET_TYPES = {
  [TicketType.GUEST]: 'Гость',
  [TicketType.MASTER]: 'Мастер',
  [TicketType.VOLUNTEER]: 'Волонтер',
  [TicketType.ORGS]: 'Организатор',
  [TicketType.FAMILY]: 'Семейный',
  [TicketType.FRIENDS]: 'Друзья',
  [TicketType.CASH]: 'Гость',
  [TicketType.PREFERENTIAL]: 'Льготный'
};

export const TICKET_STATUSES = {
  [TicketStatus.PAID]: 'Оплачен',
  [TicketStatus.UNPAID]: 'Не оплачен',
  [TicketStatus.USED]: 'Использован',
  [TicketStatus.INACTIVE]: 'Неактивен'
};
export const ERROR_MESSAGES = {
  INVALID_TICKET_ID: 'Неверный формат ID билета',
  TICKET_NOT_FOUND: 'Билет не найден',
  TICKET_ALREADY_USED: 'Билет уже использован',
  TICKET_INACTIVE: 'Билет неактивен',
  INVALID_QR_DATA: 'Неверный формат QR-кода',
  GENERATION_FAILED: 'Не удалось сгенерировать уникальный ID билета',
  INVALID_STATUS: 'Неверный статус билета'
};
export const ID_NUMBER_MIN = 8000000;
export const ID_NUMBER_MAX = 8999999;
