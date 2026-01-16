import { Response, NextFunction, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface CorrelationRequest extends Request {
    correlationId?: string;
}

export const correlationIdMiddleware = (req: CorrelationRequest, res: Response, next: NextFunction): void => {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
};
