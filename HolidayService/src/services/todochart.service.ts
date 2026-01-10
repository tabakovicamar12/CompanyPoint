import axios from 'axios';

const TODOCHART_SERVICE_URL = process.env.TODOCHART_SERVICE_URL || '';
const TODOCHART_ENABLED = (process.env.TODOCHART_ENABLED ?? 'true').toLowerCase() !== 'false';

interface TaskItem {
    id: number;
    todoListId: number;
    title: string;
    description: string;
    status: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export class ToDoChartService {
   
    static async hasConflictingTasks(userId: string, startDate: Date, endDate: Date): Promise<boolean> {
        if (!TODOCHART_ENABLED || !TODOCHART_SERVICE_URL) {
            return false;
        }
        try {
            const employeeId = parseInt(userId);
            
            if (isNaN(employeeId)) {
                console.warn(`Cannot check tasks for non-integer user ID: ${userId}`);
                return false;
            }

            const response = await axios.get<TaskItem[]>(
                `${TODOCHART_SERVICE_URL}/toDoChartService/tasks/byEmployee/${employeeId}`
            );

            const tasks = response.data;

            const conflictingTasks = tasks.filter(task => {
                if (!task.dueDate || task.status === 'Done') {
                    return false;
                }

                const dueDate = new Date(task.dueDate);
                return dueDate >= startDate && dueDate <= endDate && 
                       (task.status === 'Pending' || task.status === 'InProgress');
            });

            return conflictingTasks.length > 0;
        } catch (error) {
            if ((error as any)?.code === 'ECONNREFUSED') {
                return false;
            }
            return false;
        }
    }

    static async getTasksInDateRange(userId: string, startDate: Date, endDate: Date): Promise<TaskItem[]> {
        try {
            if (!TODOCHART_ENABLED || !TODOCHART_SERVICE_URL) {
                return [];
            }
            const employeeId = parseInt(userId);
            
            if (isNaN(employeeId)) {
                return [];
            }

            const response = await axios.get<TaskItem[]>(
                `${TODOCHART_SERVICE_URL}/toDoChartService/tasks/byEmployee/${employeeId}`
            );

            const tasks = response.data;

            return tasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= startDate && dueDate <= endDate;
            });
        } catch (error) {
            return [];
        }
    }
}
