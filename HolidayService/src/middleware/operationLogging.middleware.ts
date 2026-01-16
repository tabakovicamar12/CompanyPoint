import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { CorrelationRequest } from './correlationId.middleware';
import { LoggerUtil } from '../utils/logger.util';

type EnhancedRequest = AuthRequest & CorrelationRequest;


export const operationLoggingMiddleware = (
    req: EnhancedRequest,
    res: Response,
    next: NextFunction
): void => {
    const correlationId = req.correlationId || 'unknown';
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const userId = req.user?.id;

    if (req.method === 'POST' && req.path.includes('/requests')) {
        LoggerUtil.info(url, correlationId, 'Creating new holiday request', {
            method: req.method,
            userId
        });
    }

    if (req.method === 'PUT' && req.path.includes('/review')) {
        LoggerUtil.info(url, correlationId, 'Reviewing holiday request', {
            method: req.method,
            userId
        });
    }

    if (req.method === 'DELETE') {
        LoggerUtil.warn(url, correlationId, 'Deleting holiday request', {
            method: req.method,
            userId
        });
    }

    next();
};
