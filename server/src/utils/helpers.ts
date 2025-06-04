import { ID_NUMBER_MIN, ID_NUMBER_MAX } from '../config/constants.js';
import { TicketType } from '../types/ticket.js';
import { checkTicketIdExists } from '../db/queries.js';

export function formatTicketId(type: TicketType, number: number): string {
  const prefix = type.charAt(0);
  // Разделяем номер на части (первые 3 и последние 4 цифры)
  const firstPart = Math.floor(number / 10000).toString().padStart(3, '0');
  const secondPart = (number % 10000).toString().padStart(4, '0');
  return `${prefix}-${firstPart}-${secondPart}`;
}

export async function generateUniqueTicketId(type: TicketType): Promise<string> {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const randomNumber = Math.floor(
      Math.random() * (ID_NUMBER_MAX - ID_NUMBER_MIN + 1) + ID_NUMBER_MIN
    );
    
    const ticketId = formatTicketId(type, randomNumber);
    const exists = await checkTicketIdExists(ticketId);
    
    if (!exists) {
      return ticketId;
    }
    
    attempts++;
  }
  
  throw new Error('Не удалось сгенерировать уникальный ID билета после нескольких попыток');
}

export function validateTicketId(id: string): boolean {
  // Проверяем формат Y-XXX-XXXX, где Y - один из допустимых префиксов (G, M, V, O, S, F, C, L)
  const regex = /^[GMVOSFCL]-\d{3}-\d{4}$/;
  return regex.test(id);
}

export function parseTicketTypeFromId(id: string): TicketType | null {
  if (!id || id.length < 1) return null;
  
  const prefix = id.charAt(0);
  switch (prefix) {
    case 'G': return TicketType.GUEST;
    case 'M': return TicketType.MASTER;
    case 'V': return TicketType.VOLUNTEER;
    case 'O': return TicketType.ORGS; 
    case 'S': return TicketType.FAMILY;
    case 'F': return TicketType.FRIENDS;
    case 'C': return TicketType.CASH;
    case 'L': return TicketType.PREFERENTIAL;
    default: return null;
  }
}

export function formatDate(date: Date | string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
  };
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', options);
  return formattedDate;
}
