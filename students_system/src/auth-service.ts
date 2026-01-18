import { Injectable, inject } from '@angular/core';
import { environment } from './environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url: string = "";
  private userSubject = new BehaviorSubject<any>(this.getStoredUser());
  user$ = this.userSubject.asObservable();
  private router = inject(Router);

  constructor() {
    this.url = environment.url;
  }

  async register(email: string, password: string, role: string = 'user') {
    const response = await fetch(`${this.url}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await response.json();

    this.userSubject.next(data);

    if (data.token && data.employeeId && data.email && data.role) {
      const userName = data.user.name;
      const userRole = data.user?.role || data.role;
      const userId = data.user?.id?.toString() || data.employeeId?.toString();

      this.saveToLocal(data.token, userId, userName, userRole);
      this.userSubject.next({ email: userName, role: userRole });
    }
    return data;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.url}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (data.token) {
      const userName = data.user.name;
      const userRole = data.user.role;
      const userId = data.user.id.toString();

      this.saveToLocal(data.token, userId, userName, userRole);
      
      const userData = { email: userName, role: userRole };
      this.userSubject.next(userData);
      
      window.dispatchEvent(new Event('userLoggedIn'));
    }
    return data;
  }

  async updatePassword(passwords: { currentPassword: string; newPassword: string }) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${this.url}/updatePassword`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(passwords)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update password');
    }

    return data;
  }

  async deleteUser(userId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.url}/unregister/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  }

  async setRole(userId: string, role: string) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${this.url}/setRole/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to set role');
    return data;
  }

  async getUserData() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch(`${this.url}/getUserData`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.logout();
        return null;
      }

      const data = await response.json();
      this.userSubject.next(data);
      return data;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async getRoles(): Promise<string[]> {
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
      const response = await fetch(`${this.url}/roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error("Server vratio grešku:", response.status);
        return [];
      }

      const data = await response.json();
      return data.roles || [];

    } catch (error) {
      console.error("Greška pri dohvatanju uloga:", error);
      return [];
    }
  }

  async getAllEmployees(): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const response = await fetch(`${this.url}/getAllUsers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    return await response.json();
  }

  private getStoredUser() {
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    if (email && role) {
      return { email, role };
    }
    return null;
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  private saveToLocal(token: string, employeeId: string, email: string, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('employeeId', employeeId.toString());
    localStorage.setItem('email', email);
    localStorage.setItem('role', role);
  }

  getEmployeeId(): number {
    const id = localStorage.getItem('employeeId');
    return id ? parseInt(id) : 0;
  }
}
