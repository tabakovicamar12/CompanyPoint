import { AppDataSource } from '../config/database';
import { Log } from '../entities/Log';
import { rabbitmqService, LogMessage } from './rabbitmq.service';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

interface LogFilters {
    logType?: 'INFO' | 'ERROR' | 'WARN';
    correlationId?: string;
    limit?: number;
}

export class LogService {
    private logRepository = AppDataSource.getRepository(Log);

  
    async fetchLogsFromRabbitMQ(): Promise<{ count: number; logs: Log[] }> {
        try {
   
            const logMessages = await rabbitmqService.consumeAllLogs();

            if (logMessages.length === 0) {
                return { count: 0, logs: [] };
            }
            const logEntities = logMessages.map(logMsg => {
                const log = new Log();
                log.timestamp = new Date(logMsg.timestamp);
                log.logType = logMsg.logType;
                log.url = logMsg.url;
                log.correlationId = logMsg.correlationId;
                log.serviceName = logMsg.serviceName;
                log.message = logMsg.message;
                log.method = logMsg.method;
                log.statusCode = logMsg.statusCode;
                log.userId = logMsg.userId;
                return log;
            });

            const savedLogs = await this.logRepository.save(logEntities);

            return {
                count: savedLogs.length,
                logs: savedLogs
            };
        } catch (error) {
            console.error('Error in fetchLogsFromRabbitMQ:', error);
            throw new Error('Failed to fetch and save logs from RabbitMQ');
        }
    }

    async getLogsByDateRange(dateFrom: Date, dateTo: Date): Promise<Log[]> {
        try {
          
            const startDate = new Date(dateFrom);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);

            const logs = await this.logRepository.find({
                where: {
                    timestamp: Between(startDate, endDate)
                },
                order: {
                    timestamp: 'DESC'
                }
            });

            return logs;
        } catch (error) {
            console.error('Error in getLogsByDateRange:', error);
            throw new Error('Failed to fetch logs by date range');
        }
    }

   
    async deleteAllLogs(): Promise<number> {
        try {
            const count = await this.logRepository.count();
            await this.logRepository.clear();
            return count;
        } catch (error) {
            console.error('Error in deleteAllLogs:', error);
            throw new Error('Failed to delete logs');
        }
    }


    async getAllLogs(filters?: LogFilters): Promise<Log[]> {
        try {
            const queryBuilder = this.logRepository.createQueryBuilder('log');

            if (filters?.logType) {
                queryBuilder.andWhere('log.logType = :logType', { logType: filters.logType });
            }

            if (filters?.correlationId) {
                queryBuilder.andWhere('log.correlationId = :correlationId', {
                    correlationId: filters.correlationId
                });
            }

            queryBuilder.orderBy('log.timestamp', 'DESC');

            if (filters?.limit) {
                queryBuilder.limit(filters.limit);
            }

            return await queryBuilder.getMany();
        } catch (error) {
            console.error('Error in getAllLogs:', error);
            throw new Error('Failed to fetch logs');
        }
    }

   
    async getLogsByCorrelationId(correlationId: string): Promise<Log[]> {
        try {
            const logs = await this.logRepository.find({
                where: { correlationId },
                order: { timestamp: 'ASC' }
            });

            return logs;
        } catch (error) {
            console.error('Error in getLogsByCorrelationId:', error);
            throw new Error('Failed to fetch logs by correlation ID');
        }
    }

  
    async createLog(logData: Omit<Log, 'id' | 'createdAt'>): Promise<Log> {
        try {
            const log = this.logRepository.create(logData);
            return await this.logRepository.save(log);
        } catch (error) {
            console.error('Error in createLog:', error);
            throw new Error('Failed to create log');
        }
    }
}
