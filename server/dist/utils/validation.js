import { TicketStatus, TicketType } from '../types/ticket.js';
export function validateTicketCreation(data) {
    const errors = [];
    if (!data.type) {
        errors.push('Ticket type is required');
    }
    else if (!Object.values(TicketType).includes(data.type)) {
        errors.push('Invalid ticket type');
    }
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('Name is required');
    }
    if (data.status && !Object.values(TicketStatus).includes(data.status)) {
        errors.push('Invalid ticket status');
    }
    if (data.phone && typeof data.phone !== 'string') {
        errors.push('Phone must be a string');
    }
    if (data.email && typeof data.email !== 'string') {
        errors.push('Email must be a string');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
export function sanitizeTicketData(data) {
    return {
        type: data.type,
        name: data.name.trim(),
        status: data.status || undefined,
        comment: data.comment ? data.comment.trim() : undefined,
        phone: data.phone ? data.phone.trim() : undefined,
        email: data.email ? data.email.trim() : undefined
    };
}
