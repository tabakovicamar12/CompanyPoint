import * as amqp from 'amqplib';

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
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private readonly exchangeName = 'logs_exchange';
    private readonly queueName = 'holiday_service_logs';
    private readonly routingKey = 'holiday.logs';
    private isConnected = false;

    async connect(): Promise<void> {
        try {
            if (this.isConnected && this.connection && this.channel) {
                return;
            }

            const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
            const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';
            const rabbitmqUrl = `amqp://${rabbitmqHost}:${rabbitmqPort}`;

            console.log(`Connecting to RabbitMQ at ${rabbitmqUrl}...`);
            const conn = await amqp.connect(rabbitmqUrl);
            this.connection = conn as any;
            this.channel = await conn.createChannel();


            await this.channel.assertExchange(this.exchangeName, 'topic', {
                durable: true
            });

        
            await this.channel.assertQueue(this.queueName, {
                durable: true
            });

          
            await this.channel.bindQueue(this.queueName, this.exchangeName, this.routingKey);

            this.isConnected = true;
            console.log('✅ RabbitMQ connected successfully');

            conn.on('error', (err: Error) => {
                console.error('RabbitMQ connection error:', err);
                this.isConnected = false;
            });

            conn.on('close', () => {
                console.log('RabbitMQ connection closed');
                this.isConnected = false;
            });
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async publishLog(logData: LogMessage): Promise<void> {
        try {
            if (!this.isConnected || !this.channel) {
                await this.connect();
            }

            const message = JSON.stringify(logData);
            this.channel!.publish(
                this.exchangeName,
                this.routingKey,
                Buffer.from(message),
                { persistent: true }
            );
        } catch (error) {
            console.error('Failed to publish log to RabbitMQ:', error);
          
        }
    }

    async consumeAllLogs(): Promise<LogMessage[]> {
        try {
            if (!this.isConnected || !this.channel) {
                await this.connect();
            }

            const logs: LogMessage[] = [];
            let shouldContinue = true;

            while (shouldContinue) {
                const message = await this.channel!.get(this.queueName, { noAck: false });
                
                if (message) {
                    try {
                        const logData = JSON.parse(message.content.toString());
                        logs.push(logData);
                        this.channel!.ack(message);
                    } catch (parseError) {
                        console.error('Failed to parse log message:', parseError);
                    
                        this.channel!.nack(message, false, false);
                    }
                } else {
                    shouldContinue = false;
                }
            }

            return logs;
        } catch (error) {
            console.error('Failed to consume logs from RabbitMQ:', error);
            throw error;
        }
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
            console.log('RabbitMQ connection closed gracefully');
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}


export const rabbitmqService = new RabbitMQService();
