import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthLogs {
  private url = 'http://localhost:3000/logs';

  async syncLogs(): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Ni žetona' };

    const response = await fetch(`${this.url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Napaka pri sinhronizaciji logov');
    }
    return await response.json();
  }

  async getLogs(from: string, to: string): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const response = await fetch(`${this.url}/${from}/${to}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Napaka pri branju logov iz baze');
    }
    return await response.json();
  }

  async clearLogs(): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) return { success: false };

    const response = await fetch(`${this.url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Napaka pri brisanju logov');
    }
    return await response.json();
  }
}
