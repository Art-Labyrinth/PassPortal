import { Router } from 'express';
import { TicketStatus, TicketType } from '../types/ticket.js';
import { createTicket, getAllTickets, getTicketById, getTicketStats, updateTicketStatus } from '../db/queries.js';
import { generateUniqueTicketId, validateTicketId } from '../utils/helpers.js';
import { generateTicketQR, parseQrData } from '../utils/qr.js';
import { sanitizeTicketData, validateTicketCreation } from '../utils/validation.js';
import { authenticate } from '../middlewares/auth.js';
const router = Router();
// Get all tickets (admin only)
router.get('/', authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'coordinator') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const tickets = await getAllTickets();
        const simplifiedTickets = tickets.map(ticket => ({
            id: ticket.id,
            name: ticket.name,
            status: ticket.status,
            comment: ticket.comment,
            purchase_date: ticket.purchase_date,
            verification_date: ticket.verification_date
        }));
        res.json({ tickets: simplifiedTickets });
    }
    catch (error) {
        next(error);
    }
});
// Get ticket statistics
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const stats = await getTicketStats();
        res.json({ stats });
    }
    catch (error) {
        next(error);
    }
});
// Get ticket by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateTicketId(id)) {
            return res.status(400).json({ error: 'Invalid ticket ID format' });
        }
        const ticket = await getTicketById(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json({ ticket });
    }
    catch (error) {
        next(error);
    }
});
// Create new ticket (for on-site purchases)
router.post('/', authenticate, async (req, res, next) => {
    try {
        const validation = validateTicketCreation(req.body);
        if (!validation.valid) {
            return res.status(400).json({ errors: validation.errors });
        }
        const ticketData = sanitizeTicketData(req.body);
        const ticketId = await generateUniqueTicketId(ticketData.type);
        // For on-site tickets, create as CASH type and mark as USED immediately
        const status = ticketData.type === TicketType.CASH ? TicketStatus.USED : (ticketData.status || TicketStatus.PAID);
        const ticket = await createTicket(ticketId, ticketData.name, status, ticketData.comment || '', ticketData.phone || '', ticketData.email || '');
        const qrCode = await generateTicketQR(ticket);
        res.status(201).json({
            ticket,
            qrCode
        });
    }
    catch (error) {
        next(error);
    }
});
// Verify ticket via QR code
router.post('/verify', authenticate, async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData || typeof qrData !== 'string') {
            return res.status(400).json({ error: 'Invalid QR data' });
        }
        const ticketId = parseQrData(qrData);
        if (!ticketId) {
            return res.status(400).json({ error: 'Invalid or tampered QR code' });
        }
        const ticket = await getTicketById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        if (ticket.status === TicketStatus.USED) {
            return res.status(400).json({
                error: 'Ticket already used',
                ticket
            });
        }
        if (ticket.status === TicketStatus.INACTIVE) {
            return res.status(400).json({
                error: 'Ticket is inactive',
                ticket
            });
        }
        if (ticket.status === TicketStatus.UNPAID) {
            return res.status(400).json({
                error: 'Ticket is not paid',
                ticket
            });
        }
        // Mark ticket as used
        await updateTicketStatus(ticket.id, TicketStatus.USED);
        ticket.status = TicketStatus.USED;
        ticket.verification_date = new Date();
        res.json({
            success: true,
            message: 'Ticket verified successfully',
            ticket
        });
    }
    catch (error) {
        next(error);
    }
});
// Update ticket status
router.patch('/:id/status', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;
        if (!validateTicketId(id)) {
            return res.status(400).json({ error: 'Invalid ticket ID format' });
        }
        if (!Object.values(TicketStatus).includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        const ticket = await getTicketById(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        await updateTicketStatus(id, status, comment);
        const updatedTicket = await getTicketById(id);
        res.json({
            success: true,
            ticket: updatedTicket
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
