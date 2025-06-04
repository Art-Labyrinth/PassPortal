import { v4 as uuidv4 } from 'uuid';
import pool from './pool.js';
import { TicketStatus } from '../types/ticket.js';
export async function createTicket(id, name, status = TicketStatus.UNPAID, comment = '', phone = '', email = '') {
    const uuid = uuidv4();
    const query = `
    INSERT INTO tickets (id, name, status, comment, uuid, phone, email)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
    const result = await pool.query(query, [
        id, name, status, comment, uuid, phone, email
    ]);
    return mapDbTicketToTicket(result.rows[0]);
}
export async function getTicketById(id) {
    const query = 'SELECT * FROM tickets WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length ? mapDbTicketToTicket(result.rows[0]) : null;
}
export async function getTicketByUuid(uuid) {
    const query = 'SELECT * FROM tickets WHERE uuid = $1';
    const result = await pool.query(query, [uuid]);
    return result.rows.length ? mapDbTicketToTicket(result.rows[0]) : null;
}
export async function updateTicketStatus(id, status, comment) {
    let query = 'UPDATE tickets SET status = $1';
    const params = [status];
    if (status === TicketStatus.USED) {
        query += ', verification_date = NOW()';
    }
    if (comment !== undefined) {
        query += ', comment = $2';
        params.push(comment);
    }
    query += ' WHERE id = $' + (params.length + 1);
    params.push(id);
    const result = await pool.query(query, params);
    if (!result.rowCount) {
        return false; // No rows updated, ticket not found
    }
    return result.rowCount > 0;
}
export async function getAllTickets() {
    const query = 'SELECT * FROM tickets ORDER BY purchase_date DESC';
    const result = await pool.query(query);
    return result.rows.map(mapDbTicketToTicket);
}
export async function checkTicketIdExists(id) {
    const query = 'SELECT 1 FROM tickets WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
}
export async function getTicketStats() {
    const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = '${TicketStatus.PAID}' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN status = '${TicketStatus.UNPAID}' THEN 1 ELSE 0 END) as unpaid,
      SUM(CASE WHEN status = '${TicketStatus.USED}' THEN 1 ELSE 0 END) as used,
      SUM(CASE WHEN status = '${TicketStatus.INACTIVE}' THEN 1 ELSE 0 END) as inactive
    FROM tickets
  `;
    const result = await pool.query(query);
    return {
        total: parseInt(result.rows[0].total) || 0,
        paid: parseInt(result.rows[0].paid) || 0,
        unpaid: parseInt(result.rows[0].unpaid) || 0,
        used: parseInt(result.rows[0].used) || 0,
        inactive: parseInt(result.rows[0].inactive) || 0
    };
}
function mapDbTicketToTicket(dbTicket) {
    return {
        id: dbTicket.id,
        name: dbTicket.name,
        status: dbTicket.status,
        comment: dbTicket.comment || '',
        uuid: dbTicket.uuid,
        phone: dbTicket.phone || '',
        email: dbTicket.email || '',
        purchase_date: new Date(dbTicket.purchase_date),
        verification_date: dbTicket.verification_date ? new Date(dbTicket.verification_date) : undefined
    };
}
