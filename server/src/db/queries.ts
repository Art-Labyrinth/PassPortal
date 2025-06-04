import pool from './pool.js';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketStatus, TicketStats } from '../types/ticket.js';

// Проверка существования билета по ID
export async function checkTicketIdExists(id: string): Promise<boolean> {
  const result = await pool.query('SELECT EXISTS(SELECT 1 FROM tickets WHERE id = $1)', [id]);
  return result.rows[0].exists;
}

// Создание нового билета
export async function createTicket(
  id: string,
  name: string,
  status: TicketStatus = TicketStatus.PAID,
  comment?: string,
  phone?: string,
  email?: string
): Promise<Ticket> {
  const uuid = uuidv4();
  const now = new Date();
  
  const query = `
    INSERT INTO tickets (id, name, status, comment, uuid, phone, email, purchase_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, name, status, comment, uuid, phone, email, now]);
  return result.rows[0];
}

// Получение билета по ID
export async function getTicketById(id: string): Promise<Ticket | null> {
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
  
  if (result.rowCount === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Получение билета по UUID
export async function getTicketByUuid(uuid: string): Promise<Ticket | null> {
  const result = await pool.query('SELECT * FROM tickets WHERE uuid = $1', [uuid]);
  
  if (result.rowCount === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Обновление статуса билета
// Обновление статуса билета
export async function updateTicketStatus(
  id: string, 
  status: TicketStatus, 
  comment?: string
): Promise<boolean> {
  let query: string;
  let params: any[];
  
  if (status === TicketStatus.USED) {
    // Если устанавливаем статус "использован", то обновляем verification_date
    const now = new Date();
    query = `
      UPDATE tickets
      SET status = $1, verification_date = $2${comment ? ', comment = $3' : ''}
      WHERE id = $${comment ? '4' : '3'}
      RETURNING *
    `;
    params = comment ? [status, now, comment, id] : [status, now, id];
  } else {
    query = `
      UPDATE tickets
      SET status = $1${comment ? ', comment = $2' : ''}
      WHERE id = $${comment ? '3' : '2'}
      RETURNING *
    `;
    params = comment ? [status, comment, id] : [status, id];
  }
  
  const result = await pool.query(query, params);
  
  // Исправление: проверяем наличие строк перед обращением к ним
  if (result.rowCount === 0) {
    return false;
  }
  
  return true;
}

// Получение всех билетов
export async function getAllTickets(): Promise<Ticket[]> {
  const result = await pool.query('SELECT * FROM tickets ORDER BY purchase_date DESC');
  return result.rows;
}

// Получение статистики по билетам
export async function getTicketStats(): Promise<TicketStats> {
  const query = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'PAID') AS paid,
      COUNT(*) FILTER (WHERE status = 'UNPAID') AS unpaid,
      COUNT(*) FILTER (WHERE status = 'USED') AS used,
      COUNT(*) FILTER (WHERE status = 'INACTIVE') AS inactive
    FROM tickets
  `;
  
  const result = await pool.query(query);
  const row = result.rows[0];
  
  return {
    total: parseInt(row.total),
    paid: parseInt(row.paid),
    unpaid: parseInt(row.unpaid),
    used: parseInt(row.used),
    inactive: parseInt(row.inactive)
  };
}
