import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private url: string = "";

  constructor() {
    this.url = environment.todo_service_url;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllTodoLists() {
    const response = await fetch(`${this.url}/todoLists`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getToDoListByEmployee(employeeId: string) {
    try {
      const response = await fetch(`${this.url}/Tasks/toDoListByEmployee/${employeeId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getTodoListById(id: number) {
    const response = await fetch(`${this.url}/todoLists/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return response.json();
  }

  async createTodoList(employeeId: string, title: string) {
    const response = await fetch(`${this.url}/todoLists`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ employeeId, title })
    });
    return response.json();
  }

  async getAllTasks() {
    const response = await fetch(`${this.url}/tasks`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getTasksByEmployee(employeeId: number) {
    const response = await fetch(`${this.url}/tasks/byEmployee/${employeeId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return response.json();
  }

  async createTask(todoListId: number, title: string, description: string, dueDate?: string) {
    const response = await fetch(`${this.url}/tasks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ todoListId, title, description, dueDate })
    });
    return response.json();
  }

  async updateTask(taskId: number, title: string, description: string, dueDate?: string) {
    const response = await fetch(`${this.url}/tasks/${taskId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, description, dueDate })
    });
    return response.status === 204;
  }

  async updateTaskStatus(taskId: number, status: string) {
    const response = await fetch(`${this.url}/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    return response.status === 204;
  }

  async deleteTask(taskId: number) {
    const response = await fetch(`${this.url}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.status === 204;
  }

  async deleteTasksByEmployee(employeeId: string) {
    const response = await fetch(`${this.url}/tasks/byEmployee/${employeeId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return response.status === 204;
  }
}
