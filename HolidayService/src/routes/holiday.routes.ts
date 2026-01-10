import { Router } from 'express';
import { HolidayController } from '../controllers/holiday.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const holidayController = new HolidayController();

router.post('/requests', authenticate, holidayController.createRequest);

router.get('/requests', authenticate, holidayController.getUserRequests);

router.get('/requests/stats/me', authenticate, holidayController.getUserStats);

router.get('/requests/:id', authenticate, holidayController.getRequestById);

router.put('/requests/:id', authenticate, holidayController.updateRequest);

router.delete('/requests/:id', authenticate, holidayController.deleteRequest);

router.get('/admin/requests', authenticate, requireAdmin, holidayController.getAllRequests);

router.post('/admin/requests/:id/review', authenticate, requireAdmin, holidayController.reviewRequest);

router.delete('/admin/requests/:id', authenticate, requireAdmin, holidayController.adminDeleteRequest);

router.get('/admin/stats/:userId', authenticate, requireAdmin, holidayController.getUserStatsById);

export default router;
