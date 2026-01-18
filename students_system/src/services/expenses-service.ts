import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface ExpensePayload {
  expenseDate: string;
  category: string;
  amount: number;
  description?: string;
  employeeId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private url: string = "";

  constructor() {
    this.url = environment.expenses_url + '/expenses';
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }


  async logExpense(payload: ExpensePayload) {
    const response = await fetch(`${this.url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to log expense');
    return response.json();
  }

  async getMyExpenses(filters?: any) {
    const queryParams = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const response = await fetch(`${this.url}/my${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return await response.json();
  }

  async updateMyExpense(id: number | string, data: Partial<ExpensePayload>) {
    const response = await fetch(`${this.url}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update expense');
    return await response.json();
  }

  async deleteMyExpense(id: number | string) {
    const response = await fetch(`${this.url}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete expense');
    return await response.json();
  }

  async getAllExpensesAdmin(filters?: any) {
    const queryParams = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const response = await fetch(`${this.url}/admin/all${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Admin: Failed to fetch all expenses');
    return await response.json();
  }

  async createForEmployeeAdmin(payload: ExpensePayload) {
    const response = await fetch(`${this.url}/admin/createForEmployee`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Admin: Failed to create expense for employee');
    }
    return await response.json();
  }

  async updateExpenseAdmin(id: number | string, data: Partial<ExpensePayload>) {
    const response = await fetch(`${this.url}/admin/update/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Admin: Failed to update expense');
    return await response.json();
  }

  async deleteExpenseAdmin(id: number | string) {
    const response = await fetch(`${this.url}/admin/delete/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Admin: Failed to delete expense');
    return await response.json();
  }
}
