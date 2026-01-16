import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { HolidayRequest } from '../entities/HolidayRequest';
import { Log } from '../entities/Log';

dotenv.config();

const envSync = process.env.DB_SYNC ?? process.env.TYPEORM_SYNC;
const isDev = process.env.NODE_ENV === 'development';
const synchronize = envSync ? envSync.toLowerCase() === 'true' : isDev;
const envLogging = process.env.DB_LOGGING;
const logging = envLogging ? envLogging.toLowerCase() === 'true' : isDev;

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'holiday_service',
    synchronize,
    logging,
    entities: [HolidayRequest, Log],
    migrations: ['src/migrations/*.ts'],
    subscribers: [],
});
