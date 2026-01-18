export interface TodoList {
  id: number;
  employeeId: number;
  title: string;
  createdAt: string;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: number;
  todoListId: number;
  title: string;
  description: string;
  status: "Pending" | "InProgress" | "Done";
  dueDate: string;
}