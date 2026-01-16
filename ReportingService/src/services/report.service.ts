import { Repository } from 'typeorm';
import AppDataSource from '../config/database';
import { Report } from '../entities/Report';
import { CreateReportFromWorkhoursDto, CreateManualReportDto, UpdateReportDto, UpdateStatusDto } from '../dtos/report.dto';
import { WorkhoursService } from './workhours.service';

export class ReportService {
    private repo: Repository<Report>;
    private workhoursService: WorkhoursService;

    constructor() {
        this.repo = AppDataSource.getRepository(Report);
        this.workhoursService = new WorkhoursService();
    }

    async createFromWorkhours(dto: CreateReportFromWorkhoursDto, token?: string): Promise<Report> {
        const summary = await this.workhoursService.fetchSummary(dto.userId, dto.periodStart, dto.periodEnd, token);
        const totalHours = summary.totalHours ?? 0;
        const totalPay = totalHours * dto.hourlyRate;

        const report = this.repo.create({
            userId: dto.userId,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            totalHours,
            hourlyRate: dto.hourlyRate,
            totalPay,
            source: 'workhours',
            status: 'draft',
            notes: dto.notes,
        });

        return this.repo.save(report);
    }

    async createManual(dto: CreateManualReportDto): Promise<Report> {
        const totalPay = dto.totalPay ?? dto.totalHours * dto.hourlyRate;
        const report = this.repo.create({
            userId: dto.userId,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            totalHours: dto.totalHours,
            hourlyRate: dto.hourlyRate,
            totalPay,
            source: 'manual',
            status: 'draft',
            notes: dto.notes,
        });
        return this.repo.save(report);
    }

    async getById(id: string): Promise<Report> {
        const report = await this.repo.findOne({ where: { id } });
        if (!report) {
            throw new Error('Report not found');
        }
        return report;
    }

    async list(userId?: string): Promise<Report[]> {
        return this.repo.find({
            where: userId ? { userId } : {},
            order: { periodStart: 'DESC' }
        });
    }

    async update(id: string, dto: UpdateReportDto): Promise<Report> {
        const report = await this.getById(id);
        if (dto.hourlyRate !== undefined) {
            report.hourlyRate = dto.hourlyRate;
            report.totalPay = report.totalHours * dto.hourlyRate;
        }
        if (dto.totalHours !== undefined) {
            report.totalHours = dto.totalHours;
            report.totalPay = (dto.hourlyRate ?? report.hourlyRate) * report.totalHours;
        }
        if (dto.totalPay !== undefined) {
            report.totalPay = dto.totalPay;
        }
        if (dto.notes !== undefined) {
            report.notes = dto.notes;
        }
        return this.repo.save(report);
    }

    async updateStatus(id: string, dto: UpdateStatusDto): Promise<Report> {
        const report = await this.getById(id);
        report.status = dto.status;
        return this.repo.save(report);
    }

    async deleteById(id: string): Promise<void> {
        await this.repo.delete({ id });
    }

    async deleteAll(): Promise<number> {
        const count = await this.repo.count();
        await this.repo.clear();
        return count;
    }
}
