import { Injectable, inject } from '@angular/core';
import { environment } from '../environments/environment';

export interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  status: string;
  hireDate?: string;
  updatedAt?: string;
}

export interface RoleUpdateDto {
  position: string;
  department: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private baseUrl: string = `${environment.employee_url}/employeeService/employees`;

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllEmployees(): Promise<Employee[]> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return await response.json();
  }

  async getEmployeeById(id: number): Promise<Employee> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Employee not found');
    return await response.json();
  }

  async createEmployee(employee: Employee): Promise<Employee> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(employee)
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return await response.json();
  }

  async bulkImport(employees: Employee[]): Promise<{ count: number }> {
    const response = await fetch(`${this.baseUrl}/bulkImport`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(employees)
    });
    if (!response.ok) throw new Error('Bulk import failed');
    return await response.json();
  }

  async updateEmployee(id: number, employee: Employee): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(employee)
    });
    if (!response.ok) throw new Error('Failed to update employee');
  }

  async updateEmployeeRole(id: number, roleDto: RoleUpdateDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(roleDto)
    });
    if (!response.ok) throw new Error('Failed to update role');
  }

  async deleteEmployee(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete employee');
  }

  async deleteByDepartment(department: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/byDepartment/${department}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete department employees');
  }
}