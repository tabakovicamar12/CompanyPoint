import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { CorrelationRequest } from './correlationId.middleware';
import { rabbitmqService, LogMessage } from '../services/rabbitmq.service';

type LoggingRequest = AuthRequest & CorrelationRequest;

export const loggingMiddleware = (
    req: LoggingRequest,
    res: Response,
    next: NextFunction
): void => {
    const startTime = Date.now();
    const correlationId = req.correlationId || 'unknown';
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const requestLog: LogMessage = {
        timestamp: new Date().toISOString(),
        logType: 'INFO',
        url,
        correlationId,
        serviceName: 'HolidayService',
        message: `Incoming ${req.method} request`,
        method: req.method,
        userId: req.user?.id
    };

    rabbitmqService.publishLog(requestLog);
    const originalSend = res.send;
    res.send = function (data: any): Response {
        const duration = Date.now() - startTime;
        const logType = res.statusCode >= 400 ? 'ERROR' : res.statusCode >= 300 ? 'WARN' : 'INFO';

        const responseLog: LogMessage = {
            timestamp: new Date().toISOString(),
            logType,
            url,
            correlationId,
            serviceName: 'HolidayService',
            message: `Response sent - ${res.statusCode} (${duration}ms)`,
            method: req.method,
            statusCode: res.statusCode,
            userId: req.user?.id
        };

        rabbitmqService.publishLog(responseLog);
        return originalSend.call(this, data);
    };

    next();
};
