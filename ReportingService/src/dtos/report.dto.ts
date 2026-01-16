export interface CreateReportFromWorkhoursDto {
    userId: string;
    periodStart: string;
    periodEnd: string;
    hourlyRate: number;
    notes?: string;
}

export interface CreateManualReportDto {
    userId: string;
    periodStart: string;
    periodEnd: string;
    totalHours: number;
    hourlyRate: number;
    totalPay?: number;
    notes?: string;
}

export interface UpdateReportDto {
    totalHours?: number;
    hourlyRate?: number;
    totalPay?: number;
    notes?: string;
}

export interface UpdateStatusDto {
    status: string;
}
