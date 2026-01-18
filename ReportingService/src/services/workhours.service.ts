import axios from 'axios';

export interface WorkhourEntry {
    id: string;
    employee_id: string;
    task_id?: string;
    work_date: string;
    hours: number;
    work_type?: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface WorkhourSummary {
    userId: string;
    periodStart: string;
    periodEnd: string;
    totalHours: number;
    entries: WorkhourEntry[];
}

export class WorkhoursService {
    private baseUrl = process.env.WORKHOURS_SERVICE_URL || 'http://localhost:3002';

    async fetchSummary(userId: string, periodStart: string, periodEnd: string, token?: string): Promise<WorkhourSummary> {
        const url = `${this.baseUrl}/workHours/my`;
        const headers = token ? { Authorization: token } : {};
        
        try {
            const response = await axios.get(url, {
                params: { from: periodStart, to: periodEnd },
                headers
            });
            
            const entries: WorkhourEntry[] = response.data || [];
            const totalHours = entries.reduce((sum, entry) => {
                const hours = typeof entry.hours === 'string' ? parseFloat(entry.hours) : entry.hours;
                return sum + (hours || 0);
            }, 0);
            
            return {
                userId,
                periodStart,
                periodEnd,
                totalHours,
                entries
            };
        } catch (error) {
            console.error('Error fetching workhours:', error);
            throw new Error(`Failed to fetch workhours from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
