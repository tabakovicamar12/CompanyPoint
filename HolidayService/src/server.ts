import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { rabbitmqService } from './services/rabbitmq.service';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 5004;

async function startServer() {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');

        console.log('Connecting to RabbitMQ...');
        await rabbitmqService.connect();
        console.log('✅ RabbitMQ connected successfully');

        app.listen(PORT, () => {
            console.log(`🚀 HolidayService is running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    await rabbitmqService.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    await rabbitmqService.close();
    process.exit(0);
});

startServer();
