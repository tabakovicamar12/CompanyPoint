
export interface CreateHolidayRequestDto {
    startDate: string;  
    endDate: string;    
    reason?: string;
}


export interface UpdateHolidayRequestDto {
    startDate?: string;
    endDate?: string;
    reason?: string;
}

export interface ReviewHolidayRequestDto {
    status: 'approved' | 'rejected';
    reviewComment?: string;
}

export interface HolidayRequestResponseDto {
    id: string;
    userId: string;
    userName?: string;
    startDate: string;
    endDate: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    numberOfDays: number;
    reviewedBy?: string;
    reviewComment?: string;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HolidayRequestFilters {
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    userId?: string;
    startDate?: string;
    endDate?: string;
}
