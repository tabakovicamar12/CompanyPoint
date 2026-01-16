import 'reflect-metadata';
import app from './app';
import AppDataSource from './config/database';
import { rabbitmqService } from './services/rabbitmq.service';

const PORT = process.env.PORT || 5008;

async function start(): Promise<void> {
    try {
    
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('Database initialized');
        }

       
        await rabbitmqService.connect();
        console.log('RabbitMQ connected');

        const server = app.listen(PORT, () => {
            console.log(`ReportingService listening on port ${PORT}`);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(async () => {
                await rabbitmqService.close();
                if (AppDataSource.isInitialized) {
                    await AppDataSource.destroy();
                }
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
