import { createHmac } from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env.js';
export function createTicketToken(ticketId) {
    const timestamp = Date.now();
    const data = `${ticketId}:${timestamp}`;
    const hmac = createHmac('sha256', env.QR_SECRET)
        .update(data)
        .digest('hex');
    return `${data}:${hmac}`;
}
export function verifyTicketToken(token) {
    const parts = token.split(':');
    if (parts.length !== 3) {
        return null;
    }
    const [ticketId, timestamp, receivedHmac] = parts;
    const data = `${ticketId}:${timestamp}`;
    const expectedHmac = createHmac('sha256', env.QR_SECRET)
        .update(data)
        .digest('hex');
    if (receivedHmac !== expectedHmac) {
        return null; // Invalid signature
    }
    // Token is valid, return the ticket ID
    return ticketId;
}
export async function generateTicketQR(ticket) {
    const token = createTicketToken(ticket.id);
    return await QRCode.toDataURL(token);
}
export function parseQrData(qrData) {
    return verifyTicketToken(qrData);
}
