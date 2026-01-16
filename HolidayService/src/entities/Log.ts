import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('logs')
export class Log {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'timestamp' })
    @Index()
    timestamp!: Date;

    @Column({ type: 'varchar', length: 10 })
    logType!: 'INFO' | 'ERROR' | 'WARN';

    @Column({ type: 'text' })
    url!: string;

    @Column({ type: 'varchar', length: 100 })
    @Index()
    correlationId!: string;

    @Column({ type: 'varchar', length: 100 })
    serviceName!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    method?: string;

    @Column({ type: 'int', nullable: true })
    statusCode?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    userId?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
