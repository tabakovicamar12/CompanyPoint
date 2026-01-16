import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { logService } from '../services/log.service';
import { rabbitmqService } from '../services/rabbitmq.service';

export class LogController {
    fetchAndSaveLogs = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const logs = await rabbitmqService.consumeAllLogs();
            await logService.saveLogs(logs);
            res.json({ message: `Saved ${logs.length} logs` });
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch logs' });
        }
    };

    getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const logs = await logService.getAllLogs();
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve logs' });
        }
    };

    deleteLogs = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const count = await logService.clearLogs();
            res.json({ message: 'Logs deleted', deleted: count });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete logs' });
        }
    };
}
