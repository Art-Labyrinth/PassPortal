import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env.js';

// Создание токена для билета (для QR-кода)
export function createTicketToken(ticketId: string): string {
  const timestamp = Date.now();
  const data = `${ticketId}:${timestamp}`;
  
  // Создаем HMAC подпись с секретным ключом
  const hmac = crypto.createHmac('sha256', env.QR_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  // Формат: ticketId:timestamp:signature
  return `${data}:${signature}`;
}

// Проверка токена билета из QR-кода
export function verifyTicketToken(token: string): string | null {
  // Разделяем токен на части
  const parts = token.split(':');
  
  if (parts.length !== 3) {
    return null;
  }
  
  const [ticketId, timestamp, receivedSignature] = parts;
  const data = `${ticketId}:${timestamp}`;
  
  // Пересоздаем подпись для проверки
  const hmac = crypto.createHmac('sha256', env.QR_SECRET);
  hmac.update(data);
  const expectedSignature = hmac.digest('hex');
  
  // Сравниваем подписи
  if (receivedSignature !== expectedSignature) {
    return null;
  }
  
  return ticketId;
}

// Генерация QR-кода для билета
export async function generateTicketQR(ticketId: string): Promise<string> {
  const token = createTicketToken(ticketId);
  
  try {
    // Генерация QR-кода в формате Data URL
    return await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H', // Высокий уровень коррекции ошибок
      margin: 2,
      scale: 4
    });
  } catch (error) {
    console.error('Ошибка при генерации QR-кода:', error);
    throw new Error('Не удалось сгенерировать QR-код');
  }
}

// Извлечение ID билета из данных QR-кода
export function parseQrData(qrData: string): string | null {
  return verifyTicketToken(qrData);
}
