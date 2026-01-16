import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column({ type: 'date' })
    periodStart: Date;

    @Column({ type: 'date' })
    periodEnd: Date;

    @Column({ type: 'numeric' })
    totalHours: number;

    @Column({ type: 'numeric' })
    hourlyRate: number;

    @Column({ type: 'numeric' })
    totalPay: number;

    @Column({ default: 'draft' })
    status: string;

    @Column({ nullable: true })
    source: string;

    @Column({ nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
