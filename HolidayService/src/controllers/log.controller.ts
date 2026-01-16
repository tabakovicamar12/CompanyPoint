import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { CorrelationRequest } from '../middleware/correlationId.middleware';
import { LogService } from '../services/log.service';

type LogRequest = AuthRequest & CorrelationRequest;

export class LogController {
    private logService: LogService;

    constructor() {
        this.logService = new LogService();
    }


    fetchAndSaveLogs = async (req: LogRequest, res: Response): Promise<void> => {
        try {
            const result = await this.logService.fetchLogsFromRabbitMQ();
            res.status(201).json({
                message: 'Logs fetched and saved successfully',
                count: result.count,
                logs: result.logs
            });
        } catch (error) {
            console.error('Error fetching logs from RabbitMQ:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch logs from RabbitMQ'
            });
        }
    };

  
    getLogsByDateRange = async (req: LogRequest, res: Response): Promise<void> => {
        try {
            const { dateFrom, dateTo } = req.params;

            // Validate dates
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
                return;
            }

            if (fromDate > toDate) {
                res.status(400).json({ error: 'dateFrom must be before or equal to dateTo' });
                return;
            }

            const logs = await this.logService.getLogsByDateRange(fromDate, toDate);
            res.json({
                dateFrom: fromDate.toISOString(),
                dateTo: toDate.toISOString(),
                count: logs.length,
                logs
            });
        } catch (error) {
            console.error('Error fetching logs by date range:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch logs'
            });
        }
    };

  
    deleteAllLogs = async (req: LogRequest, res: Response): Promise<void> => {
        try {
            const deletedCount = await this.logService.deleteAllLogs();
            res.json({
                message: 'All logs deleted successfully',
                deletedCount
            });
        } catch (error) {
            console.error('Error deleting logs:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to delete logs'
            });
        }
    };

 
    getAllLogs = async (req: LogRequest, res: Response): Promise<void> => {
        try {
            const logType = req.query.logType as 'INFO' | 'ERROR' | 'WARN' | undefined;
            const correlationId = req.query.correlationId as string | undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

            const logs = await this.logService.getAllLogs({ logType, correlationId, limit });
            res.json({
                count: logs.length,
                logs
            });
        } catch (error) {
            console.error('Error fetching all logs:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch logs'
            });
        }
    };


    getLogsByCorrelationId = async (req: LogRequest, res: Response): Promise<void> => {
        try {
            const { correlationId } = req.params;
            const logs = await this.logService.getLogsByCorrelationId(correlationId);
            res.json({
                correlationId,
                count: logs.length,
                logs
            });
        } catch (error) {
            console.error('Error fetching logs by correlation ID:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch logs'
            });
        }
    };
}
