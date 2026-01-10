import { Repository, Between, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { HolidayRequest, HolidayStatus } from '../entities/HolidayRequest';
import {
    CreateHolidayRequestDto,
    UpdateHolidayRequestDto,
    ReviewHolidayRequestDto,
    HolidayRequestResponseDto,
    HolidayRequestFilters
} from '../dtos/holiday.dto';
import { ToDoChartService } from './todochart.service';

export class HolidayService {
    private holidayRepository: Repository<HolidayRequest>;

    constructor() {
        this.holidayRepository = AppDataSource.getRepository(HolidayRequest);
    }

   
    async createHolidayRequest(
        userId: string,
        userName: string,
        dto: CreateHolidayRequestDto
    ): Promise<HolidayRequestResponseDto> {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        if (startDate > endDate) {
            throw new Error('Start date must be before end date');
        }

        if (startDate < new Date()) {
            throw new Error('Cannot request holiday for past dates');
        }

        const hasConflicts = await ToDoChartService.hasConflictingTasks(userId, startDate, endDate);
        if (hasConflicts) {
            throw new Error('You have pending or in-progress tasks during the requested holiday period. Please complete or reschedule them first.');
        }

        // Check for overlapping holiday requests
        const overlapping = await this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.userId = :userId', { userId })
            .andWhere('holiday.status != :rejected', { rejected: HolidayStatus.REJECTED })
            .andWhere(
                '(holiday.startDate <= :endDate AND holiday.endDate >= :startDate)',
                { startDate, endDate }
            )
            .getOne();

        if (overlapping) {
            throw new Error('You already have a holiday request for this period');
        }

        const holidayRequest = this.holidayRepository.create({
            userId,
            userName,
            startDate,
            endDate,
            reason: dto.reason,
            status: HolidayStatus.PENDING
        });

        const saved = await this.holidayRepository.save(holidayRequest);
        return this.toResponseDto(saved);
    }

    async getUserHolidayRequests(
        userId: string,
        status?: 'pending' | 'approved' | 'rejected' | 'all'
    ): Promise<HolidayRequestResponseDto[]> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.userId = :userId', { userId });

        if (status && status !== 'all') {
            queryBuilder.andWhere('holiday.status = :status', { status });
        }

        queryBuilder.orderBy('holiday.createdAt', 'DESC');

        const requests = await queryBuilder.getMany();
        return requests.map(r => this.toResponseDto(r));
    }

    async getHolidayRequestById(id: string, userId?: string): Promise<HolidayRequestResponseDto> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.id = :id', { id });

        if (userId) {
            queryBuilder.andWhere('holiday.userId = :userId', { userId });
        }

        const request = await queryBuilder.getOne();

        if (!request) {
            throw new Error('Holiday request not found');
        }

        return this.toResponseDto(request);
    }

    async updateHolidayRequest(
        id: string,
        userId: string,
        dto: UpdateHolidayRequestDto
    ): Promise<HolidayRequestResponseDto> {
        const request = await this.holidayRepository.findOne({
            where: { id, userId }
        });

        if (!request) {
            throw new Error('Holiday request not found');
        }

        if (request.status !== HolidayStatus.PENDING) {
            throw new Error('Can only update pending holiday requests');
        }

        if (dto.startDate) request.startDate = new Date(dto.startDate);
        if (dto.endDate) request.endDate = new Date(dto.endDate);
        if (dto.reason !== undefined) request.reason = dto.reason;

        if (request.startDate > request.endDate) {
            throw new Error('Start date must be before end date');
        }

        if (request.startDate < new Date()) {
            throw new Error('Cannot set holiday to past dates');
        }

        const hasConflicts = await ToDoChartService.hasConflictingTasks(
            userId,
            request.startDate,
            request.endDate
        );
        if (hasConflicts) {
            throw new Error('You have pending tasks during the requested period');
        }

        const updated = await this.holidayRepository.save(request);
        return this.toResponseDto(updated);
    }

    async deleteHolidayRequest(id: string, userId: string): Promise<void> {
        const request = await this.holidayRepository.findOne({
            where: { id, userId }
        });

        if (!request) {
            throw new Error('Holiday request not found');
        }

        if (request.status !== HolidayStatus.PENDING) {
            throw new Error('Can only delete pending holiday requests');
        }

        await this.holidayRepository.remove(request);
    }

    async getAllHolidayRequests(filters: HolidayRequestFilters): Promise<HolidayRequestResponseDto[]> {
        const queryBuilder = this.holidayRepository.createQueryBuilder('holiday');

        if (filters.status && filters.status !== 'all') {
            queryBuilder.where('holiday.status = :status', { status: filters.status });
        }

        if (filters.userId) {
            queryBuilder.andWhere('holiday.userId = :userId', { userId: filters.userId });
        }

        if (filters.startDate) {
            queryBuilder.andWhere('holiday.startDate >= :startDate', { startDate: filters.startDate });
        }

        if (filters.endDate) {
            queryBuilder.andWhere('holiday.endDate <= :endDate', { endDate: filters.endDate });
        }

        queryBuilder.orderBy('holiday.createdAt', 'DESC');

        const requests = await queryBuilder.getMany();
        return requests.map(r => this.toResponseDto(r));
    }

    async reviewHolidayRequest(
        id: string,
        adminId: string,
        adminName: string,
        dto: ReviewHolidayRequestDto
    ): Promise<HolidayRequestResponseDto> {
        const request = await this.holidayRepository.findOne({ where: { id } });

        if (!request) {
            throw new Error('Holiday request not found');
        }

        if (request.status !== HolidayStatus.PENDING) {
            throw new Error('Can only review pending holiday requests');
        }

        request.status = dto.status === 'approved' ? HolidayStatus.APPROVED : HolidayStatus.REJECTED;
        request.reviewedBy = adminName;
        request.reviewComment = dto.reviewComment;
        request.reviewedAt = new Date();

        const updated = await this.holidayRepository.save(request);
        return this.toResponseDto(updated);
    }

    async adminDeleteHolidayRequest(id: string): Promise<void> {
        const request = await this.holidayRepository.findOne({ where: { id } });

        if (!request) {
            throw new Error('Holiday request not found');
        }

        await this.holidayRepository.remove(request);
    }

    async getUserHolidayStats(userId: string): Promise<{
        totalRequested: number;
        approved: number;
        pending: number;
        rejected: number;
        approvedDays: number;
    }> {
        const requests = await this.holidayRepository.find({ where: { userId } });

        const stats = {
            totalRequested: requests.length,
            approved: requests.filter(r => r.status === HolidayStatus.APPROVED).length,
            pending: requests.filter(r => r.status === HolidayStatus.PENDING).length,
            rejected: requests.filter(r => r.status === HolidayStatus.REJECTED).length,
            approvedDays: 0
        };

        stats.approvedDays = requests
            .filter(r => r.status === HolidayStatus.APPROVED)
            .reduce((sum, r) => sum + r.numberOfDays, 0);

        return stats;
    }

    private toResponseDto(request: HolidayRequest): HolidayRequestResponseDto {
        const start = request.startDate instanceof Date ? request.startDate : new Date(request.startDate);
        const end = request.endDate instanceof Date ? request.endDate : new Date(request.endDate);
        const created = request.createdAt instanceof Date ? request.createdAt : new Date(request.createdAt);
        const updated = request.updatedAt instanceof Date ? request.updatedAt : new Date(request.updatedAt);
        const reviewedAt = request.reviewedAt
            ? request.reviewedAt instanceof Date
                ? request.reviewedAt
                : new Date(request.reviewedAt)
            : undefined;

        return {
            id: request.id,
            userId: request.userId,
            userName: request.userName,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            reason: request.reason,
            status: request.status,
            numberOfDays: request.numberOfDays,
            reviewedBy: request.reviewedBy,
            reviewComment: request.reviewComment,
            reviewedAt: reviewedAt?.toISOString(),
            createdAt: created.toISOString(),
            updatedAt: updated.toISOString()
        };
    }
}
