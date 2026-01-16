import express, { Express } from 'express';
import cors from 'cors';
import reportRoutes from './routes/report.routes';
import logRoutes from './routes/log.routes';
import { correlationIdMiddleware } from './middleware/correlationId.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { operationLoggingMiddleware } from './middleware/operationLogging.middleware';

const app: Express = express();

// CORS
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
}));

// Middleware
app.use(express.json());
app.use(correlationIdMiddleware);
app.use(operationLoggingMiddleware);
app.use(loggingMiddleware);

// Routes
app.use('/reporting', reportRoutes);
app.use('/logs', logRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;
