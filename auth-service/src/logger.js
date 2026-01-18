import amqp from 'amqplib';

const APP_NAME = process.env.SERVICE_NAME || 'auth-service';
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE = process.env.LOG_EXCHANGE || 'logs.exchange';
const QUEUE = 'auth.logs.queue';
const ROUTING_KEY = process.env.LOG_ROUTING_KEY || 'auth.logs';

export async function sendLog({ type, url, correlationId, message }) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logData = {
        timestamp,
        logType: type, 
        url,
        correlationId: correlationId || '-',
        serviceName: APP_NAME,
        message: message
    };

    let conn, ch;
    try {
        conn = await amqp.connect(RABBIT_URL);
        ch = await conn.createChannel();

        await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

        await ch.assertQueue(QUEUE, { durable: true });
        await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

        ch.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(logData)), {
            persistent: true 
        });

        console.log(`[RabbitMQ] Log poslan v vrsto ${QUEUE}: ${message}`);

    } catch (err) {
        console.error('RabbitMQ Logger Napaka:', err);
    } finally {
        if (ch) await ch.close().catch(() => { });
        if (conn) await conn.close().catch(() => { });
    }
}