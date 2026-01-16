import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ReportService } from '../services/report.service';
import { CreateReportFromWorkhoursDto, CreateManualReportDto, UpdateReportDto, UpdateStatusDto } from '../dtos/report.dto';

export class ReportController {
    private service: ReportService;

    constructor() {
        this.service = new ReportService();
    }

    createFromWorkhours = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const dto = req.body as CreateReportFromWorkhoursDto;
            const token = req.headers.authorization;
            const result = await this.service.createFromWorkhours(dto, token);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create report' });
        }
    };

    createManual = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const dto = req.body as CreateManualReportDto;
            const result = await this.service.createManual(dto);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create manual report' });
        }
    };

    getReport = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const report = await this.service.getById(id);
            res.json(report);
        } catch (error) {
            res.status(404).json({ error: error instanceof Error ? error.message : 'Report not found' });
        }
    };

    listReports = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.query.userId as string | undefined;
            const reports = await this.service.list(userId);
            res.json(reports);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    };

    updateReport = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const dto = req.body as UpdateReportDto;
            const result = await this.service.update(id, dto);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update report' });
        }
    };

    updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const dto = req.body as UpdateStatusDto;
            const result = await this.service.updateStatus(id, dto);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update status' });
        }
    };

    deleteReport = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.service.deleteById(id);
            res.json({ message: 'Report deleted' });
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete report' });
        }
    };

    deleteAllReports = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const count = await this.service.deleteAll();
            res.json({ message: 'All reports deleted', deleted: count });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete reports' });
        }
    };
}
