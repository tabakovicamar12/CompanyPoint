const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const LOG_EXCHANGE = process.env.LOG_EXCHANGE || 'logs.exchange';
const LOG_QUEUE = process.env.LOG_QUEUE || 'workhours.logs.queue';
const LOG_ROUTING_KEY = process.env.LOG_ROUTING_KEY || 'workhours.logs';

let channel;
let connecting = null;

async function ensureChannel() {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();

    await ch.assertExchange(LOG_EXCHANGE, 'topic', { durable: true });
    await ch.assertQueue(LOG_QUEUE, { durable: true });
    await ch.bindQueue(LOG_QUEUE, LOG_EXCHANGE, LOG_ROUTING_KEY);

    channel = ch;
    connecting = null;

    // basic reconnect behavior
    conn.on('close', () => { channel = null; });
    conn.on('error', () => { channel = null; });

    return channel;
  })();

  return connecting;
}

async function publishLog(log) {
  try {
    const ch = await ensureChannel();
    const payload = Buffer.from(JSON.stringify(log));
    ch.publish(LOG_EXCHANGE, LOG_ROUTING_KEY, payload, { persistent: true });
  } catch (e) {
    // Ne sme crashat app-a zaradi logiranja
    console.error('[RabbitMQ] publishLog failed:', e.message);
  }
}

module.exports = { publishLog };
