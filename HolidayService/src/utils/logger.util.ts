import { rabbitmqService, LogMessage } from '../services/rabbitmq.service';


export class LoggerUtil {
   
    static info(
        url: string,
        correlationId: string,
        message: string,
        additionalData?: Partial<LogMessage>
    ): void {
        this.log('INFO', url, correlationId, message, additionalData);
    }

 
    static warn(
        url: string,
        correlationId: string,
        message: string,
        additionalData?: Partial<LogMessage>
    ): void {
        this.log('WARN', url, correlationId, message, additionalData);
    }

   
    static error(
        url: string,
        correlationId: string,
        message: string,
        additionalData?: Partial<LogMessage>
    ): void {
        this.log('ERROR', url, correlationId, message, additionalData);
    }

  
    private static log(
        logType: 'INFO' | 'ERROR' | 'WARN',
        url: string,
        correlationId: string,
        message: string,
        additionalData?: Partial<LogMessage>
    ): void {
        const logData: LogMessage = {
            timestamp: new Date().toISOString(),
            logType,
            url,
            correlationId,
            serviceName: 'HolidayService',
            message,
            ...additionalData
        };

        rabbitmqService.publishLog(logData);

        const logString = this.formatLogString(logData);
        console.log(logString);
    }

  
    private static formatLogString(log: LogMessage): string {
        return `${log.timestamp} ${log.logType} ${log.url} Correlation: ${log.correlationId} [${log.serviceName}] - ${log.message}`;
    }

  
    static serviceCall(
        serviceName: string,
        method: string,
        url: string,
        correlationId: string,
        userId?: string
    ): void {
        this.info(
            url,
            correlationId,
            `Calling ${serviceName} service`,
            { method, userId }
        );
    }

  
    static dbOperation(
        operation: string,
        entity: string,
        url: string,
        correlationId: string,
        userId?: string
    ): void {
        this.info(
            url,
            correlationId,
            `Database ${operation} on ${entity}`,
            { userId }
        );
    }
}
