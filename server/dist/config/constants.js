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
export const ID_NUMBER_MIN = 800000;
export const ID_NUMBER_MAX = 899999;
