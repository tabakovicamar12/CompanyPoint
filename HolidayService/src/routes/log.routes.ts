import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const logController = new LogController();


router.use(authenticate);


router.post('/', logController.fetchAndSaveLogs);


router.get('/:dateFrom/:dateTo', logController.getLogsByDateRange);


router.delete('/', logController.deleteAllLogs);


router.get('/', logController.getAllLogs);


router.get('/correlation/:correlationId', logController.getLogsByCorrelationId);

export default router;
