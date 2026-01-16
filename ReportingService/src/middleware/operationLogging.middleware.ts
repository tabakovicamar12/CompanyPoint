import { Response, NextFunction, Request } from 'express';
import { CorrelationRequest } from './correlationId.middleware';

type OperationRequest = CorrelationRequest & Request;

export const operationLoggingMiddleware = (req: OperationRequest, res: Response, next: NextFunction): void => {
    const correlationId = req.correlationId || 'unknown';
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [${correlationId}] ${method} ${path}`);
    next();
};
