import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new LogController();

router.use(authenticate);

// POST - fetch from RabbitMQ and save to DB
router.post('/', controller.fetchAndSaveLogs);

// GET - list all logs
router.get('/', controller.getLogs);

// DELETE - clear all logs
router.delete('/', controller.deleteLogs);

export default router;
