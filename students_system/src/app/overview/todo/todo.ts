import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../../../services/todo-service';
import { TaskItem, TodoList } from '../../../models/models.todo';
import { DragDropModule } from 'primeng/dragdrop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { MenubarModule } from 'primeng/menubar';
import { Menu } from '../menu/menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    CardModule,
    ButtonModule,
    SelectModule,
    FormsModule,
    DialogModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    BadgeModule,
    ToastModule,
    AvatarModule,
    MenubarModule,
    RouterModule
  ],
  templateUrl: './todo.html',
  styleUrl: './todo.css',
  providers: [MessageService]
})
export class Todo implements OnInit {
  get_all_employee: any = [];
  todoLists: TodoList[] = [];
  selectedList: TodoList | null = null;
  draggedTask: TaskItem | null = null;
  statuses: ('Pending' | 'InProgress' | 'Done')[] = ['Pending', 'InProgress', 'Done'];
  private cdr = inject(ChangeDetectorRef);

  displayTaskDialog: boolean = false;
  newTask: any = {
    title: '',
    description: '',
    dueDate: new Date(),
    status: 'Pending'
  };

  displayListDialog: boolean = false;
  newListTitle: string = '';

  editingTaskId: number | null = null;

  constructor(
    private todoService: TodoService,
    private messageService: MessageService
  ) { }

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    var employeeId = localStorage.getItem('employeeId');
    if (employeeId) {
      this.todoLists = await this.todoService.getToDoListByEmployee(employeeId);
    }
    if (this.todoLists.length > 0) {
      this.selectedList = this.todoLists[0];
    }

    this.cdr.detectChanges();
  }

  getTasksByStatus(status: string): TaskItem[] {
    if (!this.selectedList || !this.selectedList.tasks) return [];
    return this.selectedList.tasks.filter(t => t.status === status);
  }

  onDragStart(task: TaskItem) {
    this.draggedTask = task;
  }

  async onDrop(newStatus: string) {
    if (this.draggedTask && this.draggedTask.status !== newStatus) {
      const success = await this.todoService.updateTaskStatus(this.draggedTask.id, newStatus);
      if (success) {
        this.draggedTask.status = newStatus as 'Pending' | 'InProgress' | 'Done';
        this.messageService.add({ severity: 'info', summary: 'Status updated', detail: `Task moved to ${newStatus}` });
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error status not updated!' });
      }
      this.draggedTask = null;
    }
  }

  showAddTaskDialog(status: string) {
    this.editingTaskId = null;
    this.newTask = {
      title: '',
      description: '',
      dueDate: new Date(),
      status: status as 'Pending' | 'InProgress' | 'Done'
    };
    this.displayTaskDialog = true;
  }

  async saveTask() {
    if (this.newTask.title !== null) {
      if (this.selectedList && this.newTask.title) {
        try {
          const dueDate = this.newTask.dueDate instanceof Date
            ? this.newTask.dueDate.toISOString()
            : this.newTask.dueDate;

          if (this.editingTaskId) {
            const success = await this.todoService.updateTask(
              this.editingTaskId,
              this.newTask.title,
              this.newTask.description,
              dueDate
            );

            if (success && this.selectedList.tasks) {
              const taskIndex = this.selectedList.tasks.findIndex(t => t.id === this.editingTaskId);
              if (taskIndex !== -1) {
                this.selectedList.tasks[taskIndex] = {
                  ...this.selectedList.tasks[taskIndex],
                  title: this.newTask.title,
                  description: this.newTask.description,
                  dueDate: dueDate
                };
              }
            }
            this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Task updated' });
          } else {
            const createdTask = await this.todoService.createTask(
              this.selectedList.id,
              this.newTask.title,
              this.newTask.description,
              dueDate
            );

            if (this.selectedList.tasks) {
              this.selectedList.tasks.push(createdTask);
            } else {
              this.selectedList.tasks = [createdTask];
            }
            this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Task added' });
          }

          this.displayTaskDialog = false;
          this.editingTaskId = null;
        } catch (error) {
          console.error("Error data not saved", error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error saving data' });
        }
      }
    }
    else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Title is required' });
    }
  }

  async deleteTask(id: number) {
    if (confirm('Are you sure to delete task?')) {
      try {
        const success = await this.todoService.deleteTask(id);
        if (success && this.selectedList && this.selectedList.tasks) {
          this.selectedList.tasks = this.selectedList.tasks.filter(t => t.id !== id);
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Task deleted' });
        }
      } catch (error) {
        console.error("Error deleting task", error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting task' });
      }
    }
  }

  showNewListDialog() {
    this.newListTitle = '';
    this.displayListDialog = true;
  }

  async saveNewList() {
    if (this.newListTitle.trim()) {
      try {
        const employeeId = localStorage.getItem('employeeId');

        if (employeeId) {
          const newList = await this.todoService.createTodoList(employeeId, this.newListTitle);
          this.todoLists.push(newList);
          this.selectedList = newList;
          this.displayListDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'List created' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No employee ID' });
        }
      } catch (error) {
        console.error("Error creating list", error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error creating list' });
      }
    }
  }

  editTask(task: TaskItem) {
    this.editingTaskId = task.id;
    this.newTask = {
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate),
      status: task.status
    };
    this.displayTaskDialog = true;
  }

  async deleteAllTasksForEmployee() {
    const employeeId = localStorage.getItem('employeeId');

    if (!employeeId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No employee ID found' });
      return;
    }

    if (confirm('Are you absolutely sure you want to delete ALL your tasks from ALL lists?')) {
      try {
        const success = await this.todoService.deleteTasksByEmployee(employeeId);

        if (success) {
          this.todoLists.forEach(list => list.tasks = []);

          if (this.selectedList) {
            this.selectedList.tasks = [];
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'All tasks have been removed'
          });

          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error("Error during mass delete:", error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete tasks' });
      }
    }
  }
}
