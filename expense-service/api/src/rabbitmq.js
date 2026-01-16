const amqplib = require('amqplib');

let conn = null;
let channel = null;
let initializing = null;

const getAmqpUrl = () => {
  const host = process.env.RABBITMQ_HOST || 'rabbitmq';
  const port = process.env.RABBITMQ_PORT || '5672';
  const user = process.env.RABBITMQ_USER || 'guest';
  const pass = process.env.RABBITMQ_PASS || 'guest';
  return `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
};

async function initRabbit() {
  if (channel) return channel;
  if (initializing) return initializing;

  initializing = (async () => {
    const url = getAmqpUrl();

    conn = await amqplib.connect(url);
    channel = await conn.createChannel();

    const exchange = process.env.LOG_EXCHANGE || 'companypoint.logs';
    const queue = process.env.LOG_QUEUE || 'expense.logs';
    const routingKey = process.env.LOG_ROUTING_KEY || 'expense';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    // bind queue -> exchange
    await channel.bindQueue(queue, exchange, routingKey);

    conn.on('close', () => {
      conn = null;
      channel = null;
      initializing = null;
    });

    conn.on('error', () => {
      // connection error; next publish will re-init
      conn = null;
      channel = null;
      initializing = null;
    });

    return channel;
  })();

  return initializing;
}

async function publishLog(logObject) {
  try {
    const ch = await initRabbit();
    const exchange = process.env.LOG_EXCHANGE || 'companypoint.logs';
    const routingKey = process.env.LOG_ROUTING_KEY || 'expense';

    const payload = Buffer.from(JSON.stringify(logObject));

    // persistent -> RabbitMQ will store to disk if durable queue
    ch.publish(exchange, routingKey, payload, { persistent: true });
  } catch (e) {
    // če RabbitMQ down, ne ruši API-ja
    console.error('RabbitMQ publish failed:', e.message);
  }
}

module.exports = { publishLog };
