import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface Report {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
  source: 'workhours' | 'manual';
  status: 'draft' | 'approved' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Log {
  id: string;
  timestamp: string;
  logType: string;
  message: string;
  correlationId: string;
  serviceName: string;
  url: string;
  method: string;
  statusCode: number;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportingService {
  private url: string = environment.reporting_url;

  constructor() { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async fetchFromWorkhours(payload: { userId: string, periodStart: string, periodEnd: string, hourlyRate: number, notes?: string }) {
    const response = await fetch(`${this.url}/reporting/fetch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to fetch from workhours');
    return await response.json();
  }

  async createManualReport(payload: any) {
    const response = await fetch(`${this.url}/reporting`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create manual report');
    return await response.json();
  }

  async getAllReports(userId?: string): Promise<Report[]> {
    const query = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${this.url}/reporting${query}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to load reports');
    return await response.json();
  }

  async getReportById(id: string): Promise<Report> {
    const response = await fetch(`${this.url}/reporting/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Report not found');
    return await response.json();
  }

  async updateReport(id: string, payload: any) {
    const response = await fetch(`${this.url}/reporting/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to update report');
    return await response.json();
  }

  async updateStatus(id: string, status: string) {
    const response = await fetch(`${this.url}/reporting/${id}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update status');
    return await response.json();
  }

  async deleteReport(id: string) {
    const response = await fetch(`${this.url}/reporting/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete report');
    return await response.json();
  }

  async syncLogs() {
    const response = await fetch(`${this.url}/logs`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to sync logs');
    return await response.json();
  }

  async getLogs(): Promise<Log[]> {
    const response = await fetch(`${this.url}/logs`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return await response.json();
  }

  async clearLogs() {
    const response = await fetch(`${this.url}/logs`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete logs');
    return await response.json();
  }
}
