import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import holidayRoutes from './routes/holiday.routes';
import logRoutes from './routes/log.routes';
import { correlationIdMiddleware } from './middleware/correlationId.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';

dotenv.config();

const app = express();


app.use(cors({
    origin: [
        'http://localhost:4200',
        'http://localhost:3000',
        'http://localhost:5004'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(correlationIdMiddleware);


app.use(loggingMiddleware);

app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        service: 'HolidayService',
        timestamp: new Date().toISOString()
    });
});

app.use('/holidayService', holidayRoutes);
app.use('/logs', logRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;
