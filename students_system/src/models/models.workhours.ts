export interface WorkHourEntry {
  id?: number;
  employee_id: string;
  task_id?: string;
  work_date: Date;
  hours: number;
  work_type?: string;
  description?: string;
  created_at?: Date;
}