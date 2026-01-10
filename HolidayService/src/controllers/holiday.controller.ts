import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { HolidayService } from '../services/holiday.service';
import {
    CreateHolidayRequestDto,
    UpdateHolidayRequestDto,
    ReviewHolidayRequestDto
} from '../dtos/holiday.dto';

export class HolidayController {
    private holidayService: HolidayService;

    constructor() {
        this.holidayService = new HolidayService();
    }

 
    createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const dto: CreateHolidayRequestDto = req.body;
            const userId = req.user!.id;
            const userName = req.user!.name;

            if (!dto.startDate || !dto.endDate) {
                res.status(400).json({ error: 'Start date and end date are required' });
                return;
            }

            const result = await this.holidayService.createHolidayRequest(userId, userName, dto);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating holiday request:', error);
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Failed to create holiday request' 
            });
        }
    };

  
    getUserRequests = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.id;
            const status = req.query.status as 'pending' | 'approved' | 'rejected' | 'all' | undefined;

            const requests = await this.holidayService.getUserHolidayRequests(userId, status);
            res.json(requests);
        } catch (error) {
            console.error('Error fetching user requests:', error);
            res.status(500).json({ error: 'Failed to fetch holiday requests' });
        }
    };

    
    getRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.role === 'admin' ? undefined : req.user!.id;

            const request = await this.holidayService.getHolidayRequestById(id, userId);
            res.json(request);
        } catch (error) {
            console.error('Error fetching holiday request:', error);
            res.status(404).json({ 
                error: error instanceof Error ? error.message : 'Holiday request not found' 
            });
        }
    };

  
    updateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const dto: UpdateHolidayRequestDto = req.body;

            const result = await this.holidayService.updateHolidayRequest(id, userId, dto);
            res.json(result);
        } catch (error) {
            console.error('Error updating holiday request:', error);
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Failed to update holiday request' 
            });
        }
    };

    
    deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;

            await this.holidayService.deleteHolidayRequest(id, userId);
            res.json({ message: 'Holiday request deleted successfully' });
        } catch (error) {
            console.error('Error deleting holiday request:', error);
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Failed to delete holiday request' 
            });
        }
    };

 
    getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.id;
            const stats = await this.holidayService.getUserHolidayStats(userId);
            res.json(stats);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    };

  
    getAllRequests = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const filters = {
                status: req.query.status as any,
                userId: req.query.userId as string,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string
            };

            const requests = await this.holidayService.getAllHolidayRequests(filters);
            res.json(requests);
        } catch (error) {
            console.error('Error fetching all requests:', error);
            res.status(500).json({ error: 'Failed to fetch holiday requests' });
        }
    };

   
    reviewRequest = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const adminId = req.user!.id;
            const adminName = req.user!.name;
            const dto: ReviewHolidayRequestDto = req.body;

            if (!dto.status || !['approved', 'rejected'].includes(dto.status)) {
                res.status(400).json({ error: 'Status must be either "approved" or "rejected"' });
                return;
            }

            const result = await this.holidayService.reviewHolidayRequest(id, adminId, adminName, dto);
            res.json(result);
        } catch (error) {
            console.error('Error reviewing holiday request:', error);
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Failed to review holiday request' 
            });
        }
    };

 
    adminDeleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.holidayService.adminDeleteHolidayRequest(id);
            res.json({ message: 'Holiday request deleted successfully' });
        } catch (error) {
            console.error('Error deleting holiday request:', error);
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Failed to delete holiday request' 
            });
        }
    };

  
    getUserStatsById = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            const stats = await this.holidayService.getUserHolidayStats(userId);
            res.json(stats);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    };
}
