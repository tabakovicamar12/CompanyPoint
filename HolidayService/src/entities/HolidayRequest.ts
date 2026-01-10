import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum HolidayStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

@Entity('holiday_requests')
export class HolidayRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;


    @Column({ type: 'varchar', length: 255 })
    userId!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    userName?: string;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'date' })
    endDate!: Date;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({
        type: 'enum',
        enum: HolidayStatus,
        default: HolidayStatus.PENDING
    })
    status!: HolidayStatus;

    @Column({ type: 'varchar', length: 255, nullable: true })
    reviewedBy?: string;

    @Column({ type: 'text', nullable: true })
    reviewComment?: string;

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get numberOfDays(): number {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }
}
