import { TicketStatus, TicketType, ValidationResult, TicketCreationParams } from '../types/ticket.js';

// Валидация данных для создания билета
export function validateTicketCreation(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Проверка обязательных полей
  if (!data.type) {
    errors.push('Тип билета обязателен');
  } else if (!Object.values(TicketType).includes(data.type)) {
    errors.push('Недопустимый тип билета');
  }
  
  if (!data.name || (typeof data.name === 'string' && data.name.trim() === '')) {
    errors.push('Имя обязательно');
  }
  
  // Проверка статуса, если указан
  if (data.status && !Object.values(TicketStatus).includes(data.status)) {
    errors.push('Недопустимый статус билета');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Очистка и подготовка данных
export function sanitizeTicketData(data: any): TicketCreationParams {
  const sanitized: TicketCreationParams = {
    type: data.type,
    name: data.name?.trim(),
  };
  
  if (data.status) {
    sanitized.status = data.status;
  }
  
  if (data.comment) {
    sanitized.comment = data.comment.trim();
  }
  
  if (data.phone) {
    sanitized.phone = data.phone.trim();
  }
  
  if (data.email) {
    sanitized.email = data.email.trim();
  }
  
  return sanitized;
}
