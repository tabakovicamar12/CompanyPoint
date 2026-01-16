import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('logs')
export class Log {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    timestamp: string;

    @Column()
    logType: string;

    @Column()
    message: string;

    @Column()
    correlationId: string;

    @Column()
    serviceName: string;

    @Column({ nullable: true })
    url: string;

    @Column({ nullable: true })
    method: string;

    @Column({ nullable: true, type: 'int' })
    statusCode: number;

    @Column({ nullable: true })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
