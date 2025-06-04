import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { initializeDatabase } from './db/pool.js';
import ticketRoutes from './routes/tickets.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
export const app = express();
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        // Create Express app
        const app = express();
        // Middleware
        app.use(helmet());
        app.use(cors());
        app.use(express.json());
        // Routes
        app.use('/api/tickets', ticketRoutes);
        // Default route
        app.get('/', (req, res) => {
            res.json({ message: 'Ticket verification API' });
        });
        // Error handling
        app.use(notFoundHandler);
        app.use(errorHandler);
        // Start server
        const PORT = env.PORT;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
export default startServer;
