import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { CorrelationRequest } from './correlationId.middleware';
import { rabbitmqService, LogMessage } from '../services/rabbitmq.service';

type LoggingRequest = AuthRequest & CorrelationRequest;

export const loggingMiddleware = (req: LoggingRequest, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const correlationId = req.correlationId || 'unknown';
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const requestLog: LogMessage = {
        timestamp: new Date().toISOString(),
        logType: 'INFO',
        url,
        correlationId,
        serviceName: 'ReportingService',
        message: `Incoming ${req.method} request`,
        method: req.method,
        userId: req.user?.id
    };

    rabbitmqService.publishLog(requestLog);

    const originalSend = res.send.bind(res);
    res.send = ((body?: any): Response => {
        const duration = Date.now() - start;
        const logType = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        const responseLog: LogMessage = {
            timestamp: new Date().toISOString(),
            logType,
            url,
            correlationId,
            serviceName: 'ReportingService',
            message: `Response sent - ${res.statusCode} (${duration}ms)`,
            method: req.method,
            statusCode: res.statusCode,
            userId: req.user?.id
        };
        rabbitmqService.publishLog(responseLog);
        return originalSend(body);
    }) as any;

    next();
};
