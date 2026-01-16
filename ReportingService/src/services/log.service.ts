import AppDataSource from '../config/database';
import { Log } from '../entities/Log';
import { LogMessage } from './rabbitmq.service';

export class LogService {
    private repo = AppDataSource.getRepository(Log);

    async saveLogs(logMessages: LogMessage[]): Promise<void> {
        const logs = logMessages.map(msg => this.repo.create({
            timestamp: msg.timestamp,
            logType: msg.logType,
            message: msg.message,
            correlationId: msg.correlationId,
            serviceName: msg.serviceName,
            url: msg.url,
            method: msg.method,
            statusCode: msg.statusCode,
            userId: msg.userId
        }));
        await this.repo.save(logs);
    }

    async getAllLogs(): Promise<Log[]> {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }

    async clearLogs(): Promise<number> {
        const count = await this.repo.count();
        await this.repo.clear();
        return count;
    }
}

export const logService = new LogService();
