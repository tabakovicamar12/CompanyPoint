import express from 'express';
import cors from 'cors';
import router from './routes/auth.routes.js';
import swaggerRouter from './config/swagger.js';
import mongoose from 'mongoose';
import amqp from 'amqplib';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/authService', router);
app.use('/api-docs', swaggerRouter);
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});


app.post('/logs', async (req, res) => {
    let conn;
    try {
        const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
        const QUEUE = 'auth.logs.queue';

        conn = await amqp.connect(RABBIT_URL);
        const ch = await conn.createChannel();
        
        await ch.assertQueue(QUEUE, { durable: true });

        const database = mongoose.connection.db;
        if (!database) {
            throw new Error("MongoDB povezava ni aktivna");
        }

        let count = 0;
        let msg;
        
        while ((msg = await ch.get(QUEUE, { noAck: false }))) {
            const logEntry = JSON.parse(msg.content.toString());
            await database.collection('logs').insertOne({
                ...logEntry,
                timestamp: new Date(logEntry.timestamp || Date.now())
            });
            ch.ack(msg);
            count++;
        }

        await ch.close();
        await conn.close();

        res.status(200).json({ success: true, message: `Sinhroniziranih ${count} logov.` });

    } catch (err) {
        if (conn) {
            try { await conn.close(); } catch(e) {}
        }
      
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/logs/:from/:to', async (req, res) => {
    try {
        const { from, to } = req.params;
        const database = mongoose.connection.db;

        if (!database) {
            throw new Error("Baza ni dosegljiva");
        }

        const logs = await database.collection('logs').find({
            timestamp: { 
                $gte: new Date(from), 
                $lte: new Date(to) 
            }
        }).toArray();

        res.json(logs);
    } catch (err) {
        console.error("Napaka pri branju logov:", err);
        res.status(500).json({ error: "Napaka pri branju logov: " + err.message });
    }
});

app.delete('/logs', async (req, res) => {
    try {
        const database = mongoose.connection.db;

        if (!database) {
            throw new Error("Baza ni dosegljiva");
        }
        await database.collection('logs').deleteMany({});
        res.json({ success: true, message: "Vsi logi so bili uspešno izbrisani iz baze." });
    } catch (err) {
        console.error("Napaka pri brisanju logov:", err);
        res.status(500).json({ success: false, error: "Napaka pri brisanju: " + err.message });
    }
});

export default app;
