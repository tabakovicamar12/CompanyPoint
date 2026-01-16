import { Channel, Connection, connect, GetMessage } from 'amqplib';

export interface LogMessage {
    timestamp: string;
    logType: 'INFO' | 'ERROR' | 'WARN';
    url: string;
    correlationId: string;
    serviceName: string;
    message: string;
    method?: string;
    statusCode?: number;
    userId?: string;
}

export class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly exchangeName = 'logs_exchange';
    private readonly queueName = 'reporting_service_logs';
    private readonly routingKey = 'reporting.logs';
    private isConnected = false;

    async connect(): Promise<void> {
        if (this.isConnected && this.connection && this.channel) {
            return;
        }

        const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
        const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';
        const rabbitmqUrl = `amqp://${rabbitmqHost}:${rabbitmqPort}`;

        const conn = (await connect(rabbitmqUrl)) as unknown as Connection;
        this.connection = conn;
        this.channel = (await (conn as any).createChannel()) as Channel;

        await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
        await this.channel.assertQueue(this.queueName, { durable: true });
        await this.channel.bindQueue(this.queueName, this.exchangeName, this.routingKey);

        this.isConnected = true;

        conn.on('error', (err: Error) => {
            console.error('RabbitMQ connection error:', err);
            this.isConnected = false;
        });

        conn.on('close', () => {
            console.warn('RabbitMQ connection closed');
            this.isConnected = false;
        });
    }

    async publishLog(logData: LogMessage): Promise<void> {
        try {
            if (!this.isConnected || !this.channel) {
                await this.connect();
            }
            const message = JSON.stringify(logData);
            this.channel!.publish(this.exchangeName, this.routingKey, Buffer.from(message), { persistent: true });
        } catch (error) {
            console.error('Failed to publish log to RabbitMQ:', error);
        }
    }

    async consumeAllLogs(): Promise<LogMessage[]> {
        if (!this.isConnected || !this.channel) {
            await this.connect();
        }

        const logs: LogMessage[] = [];
        let keepReading = true;

        while (keepReading) {
            const channel = this.channel;
            if (!channel) {
                break;
            }
            const message: GetMessage | false = await channel.get(this.queueName, { noAck: false });
            if (!message) {
                keepReading = false;
                continue;
            }
            try {
                const data = JSON.parse(message.content.toString());
                logs.push(data);
                channel.ack(message);
            } catch (err) {
                console.error('Failed to parse log message:', err);
                channel.nack(message, false, false);
            }
        }
        return logs;
    }

    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await (this.connection as any).close();
            }
            this.isConnected = false;
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
        }
    }
}

export const rabbitmqService = new RabbitMQService();
