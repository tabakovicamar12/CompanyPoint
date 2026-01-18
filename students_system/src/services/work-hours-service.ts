import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { WorkLogPayload } from '../app/overview/workhours/workhours';

@Injectable({
  providedIn: 'root',
})
export class WorkHoursService {
  private url: string = "";

  constructor() {
    this.url = environment.work_hours_url;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async logWorkHours(payload: WorkLogPayload) {
    const response = await fetch(`${this.url}/log`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  async getMyHours() {
    const response = await fetch(`${this.url}/my`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  async updateMyHours(id: string, data: { hours?: number, description?: string }) {
    const response = await fetch(`${this.url}/update/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async deleteMyHours(id: string) {
    const response = await fetch(`${this.url}/delete/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  async getAllEmployeesHours(filters?: { employeeId?: string, from?: string, to?: string }) {
    const queryParams = filters ? '?' + new URLSearchParams(filters as any).toString() : '';

    const response = await fetch(`${this.url}/all${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  async logForEmployeeAdmin(data: any) {
    const response = await fetch(`${this.url}/admin/logForEmployee`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        employeeId: data.employeeId,
        workDate: data.workDate,
        hours: data.hours,
        description: data.description,
        taskId: data.taskId || null,
        workType: data.workType || 'Regular'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to log work as admin');
    }
    return await response.json();
  }

  async updateHoursByAdmin(id: number | string, data: any) {
    const response = await fetch(`${this.url}/admin/update/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        workDate: data.workDate,
        hours: data.hours,
        description: data.description,
        taskId: data.taskId || null,
        workType: data.workType || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update entry as admin');
    }

    return await response.json();
  }

  async deleteHoursByAdmin(id: string) {
    const response = await fetch(`${this.url}/admin/delete/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await response.json();
  }
}