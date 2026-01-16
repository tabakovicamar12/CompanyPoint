import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Report } from '../entities/Report';
import { Log } from '../entities/Log';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'reporting_user',
    password: process.env.DB_PASSWORD || 'reporting_pass',
    database: process.env.DB_DATABASE || 'reporting_service',
    synchronize: process.env.DB_SYNC === 'true',
    logging: false,
    entities: [Report, Log],
    subscribers: [],
    migrations: [],
});

export default AppDataSource;
