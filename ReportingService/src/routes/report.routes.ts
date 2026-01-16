import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

// POST - create from workhours service
router.post('/fetch', controller.createFromWorkhours);

// POST - manual report
router.post('/', controller.createManual);

// GET - list reports (optional userId)
router.get('/', controller.listReports);

// GET - single report
router.get('/:id', controller.getReport);

// PUT - update report fields
router.put('/:id', controller.updateReport);

// PUT - update status
router.put('/:id/status', controller.updateStatus);

// DELETE - single
router.delete('/:id', controller.deleteReport);

// DELETE - all
router.delete('/', controller.deleteAllReports);

export default router;
