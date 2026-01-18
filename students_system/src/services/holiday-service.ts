import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface HolidayRequestPayload {
  startDate: string;
  endDate: string;
  type?: string;
  comment?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HolidayService {
  private url: string = "";

  constructor() {
    this.url = environment.holidays_url;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async createRequest(payload: HolidayRequestPayload) {
    const response = await fetch(`${this.url}/requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create holiday request');
    return response.json();
  }

  async getMyRequests(status: string = 'all') {
    const response = await fetch(`${this.url}/requests?status=${status}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user requests');
    return await response.json();
  }

  async getMyStats() {
    const response = await fetch(`${this.url}/requests/stats/me`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch statistics');
    return await response.json();
  }

  async updateRequest(id: string, payload: Partial<HolidayRequestPayload>) {
    const response = await fetch(`${this.url}/requests/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to update holiday request');
    return await response.json();
  }

  async deleteRequest(id: string) {
    const response = await fetch(`${this.url}/requests/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete holiday request');
    return await response.json();
  }


  async getAllRequestsAdmin(filters?: { status?: string, userId?: string, startDate?: string, endDate?: string }) {
    const queryParams = filters ? '?' + new URLSearchParams(filters as any).toString() : '';
    const response = await fetch(`${this.url}/admin/requests${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Admin: Failed to fetch all requests');
    return await response.json();
  }

  async reviewRequestAdmin(id: string, status: 'approved' | 'rejected', adminComment?: string) {
    const response = await fetch(`${this.url}/admin/requests/${id}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, adminComment })
    });
    if (!response.ok) throw new Error('Admin: Failed to review request');
    return await response.json();
  }

  async getUserStatsByIdAdmin(userId: string) {
    const response = await fetch(`${this.url}/admin/stats/${userId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Admin: Failed to fetch user statistics');
    return await response.json();
  }

  async deleteRequestAdmin(id: string) {
    const response = await fetch(`${this.url}/admin/requests/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Admin: Failed to delete request');
    return await response.json();
  }
}