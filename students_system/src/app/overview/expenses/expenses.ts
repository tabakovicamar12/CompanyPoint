import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ExpensesService, ExpensePayload } from '../../../services/expenses-service';
import { AuthService } from '../../../auth-service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Menu } from '../menu/menu';
import { RouterModule } from "@angular/router";
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

interface ExpenseEntry {
  id: string;
  expenseDate: Date;
  category: string;
  amount: number;
  description: string;
  employeeId?: number;
  employeeName?: string;
}

@Component({
  selector: 'app-expenses',
  imports: [
    TableModule, ButtonModule, DialogModule, DatePickerModule,
    CommonModule, FormsModule, InputNumberModule, TextareaModule,
    ToastModule, RouterModule, InputTextModule, CardModule, SelectModule
  ],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class Expenses implements OnInit {
  private expensesService = inject(ExpensesService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = '';
  isAdmin: boolean = false;
  isUser: boolean = false;
  isLoading: boolean = false;

  userExpenses: any[] = [];

  allEmployeesExpenses: any[] = [];
  allEmployeesFiltered: any[] = [];
  selectedEmployeeId: string = '';
  selectedEmployeeName: string = '';
  filterFromDate: Date | null = null;
  filterToDate: Date | null = null;
  selectedCategory: string = '';

  displayDialog: boolean = false;
  isEdit: boolean = false;
  employees: any[] = [];

  categories: any[] = [
    { label: 'Travel', value: 'Travel' },
    { label: 'Meals', value: 'Meals' },
    { label: 'Equipment', value: 'Equipment' },
    { label: 'Software', value: 'Software' },
    { label: 'Training', value: 'Training' },
    { label: 'Other', value: 'Other' }
  ];

  currentExpense: ExpenseEntry = {
    id: '',
    expenseDate: new Date(),
    category: '',
    amount: 0,
    description: '',
  };

  ngOnInit() {
    this.initializeUserRole();
    this.loadData();
  }

  private initializeUserRole() {
    const role = localStorage.getItem('role');
    this.userRole = role || '';
    this.isAdmin = this.userRole === 'admin';
    this.isUser = this.userRole === 'user';
  }

  private async loadData() {
    this.isLoading = true;
    try {
      if (this.isUser) {
        await this.loadUserExpenses();
      } else if (this.isAdmin) {
        await Promise.all([
          this.loadAllEmployeesExpenses(),
          this.loadEmployeesForDropdown()
        ]);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      this.showError('Failed to load data');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadEmployeesForDropdown() {
    try {
      this.employees = await this.authService.getAllEmployees();
    } catch (error) {
      console.error('Failed to load employee list:', error);
    }
  }

  private async loadUserExpenses() {
    try {
      const data = await this.expensesService.getMyExpenses();
      this.userExpenses = Array.isArray(data) ? data : [];
    } catch (error) {
      this.showError('Could not load your expenses');
      this.userExpenses = [];
    }
  }

  showAddDialog() {
    this.isEdit = false;
    this.currentExpense = {
      id: '',
      expenseDate: new Date(),
      category: '',
      amount: 0,
      description: '',
    };
    this.displayDialog = true;
  }

  editExpense(expense: any) {
    this.isEdit = true;
    this.currentExpense = {
      id: expense.id,
      expenseDate: new Date(expense.expense_date),
      category: expense.category || '',
      amount: expense.amount || 0,
      description: expense.description || '',
    };
    this.displayDialog = true;
  }

  editExpenseAdmin(expense: any) {
    this.isEdit = true;
    this.currentExpense = {
      id: expense.id,
      expenseDate: new Date(expense.expense_date),
      category: expense.category || '',
      amount: expense.amount || 0,
      description: expense.description || '',
    };
    this.displayDialog = true;
  }

  async saveExpense() {
    if (!this.validateExpense(this.currentExpense)) {
      return;
    }

    const payload: ExpensePayload = {
      expenseDate: this.currentExpense.expenseDate.toISOString().split('T')[0],
      category: this.currentExpense.category,
      amount: Number(this.currentExpense.amount),
      description: this.currentExpense.description || '',
    };

    if (this.isAdmin && !this.isEdit && this.currentExpense.employeeId) {
      payload.employeeId = this.currentExpense.employeeId.toString();
    }

    try {
      if (this.isEdit) {
        if (this.isAdmin) {
          await this.expensesService.updateExpenseAdmin(this.currentExpense.id, payload);
          this.showSuccess('Expense updated successfully');
        } else {
          await this.expensesService.updateMyExpense(this.currentExpense.id, payload);
          this.showSuccess('Expense updated successfully');
        }
      } else {
        if (this.isAdmin) {
          if (!payload.employeeId) {
            this.showError('Please select an employee');
            return;
          }
          await this.expensesService.createForEmployeeAdmin(payload);
          this.showSuccess('Expense logged for employee');
        } else {
          await this.expensesService.logExpense(payload);
          this.showSuccess('Expense logged successfully');
        }
      }

      this.displayDialog = false;
      if (this.isAdmin) {
        await this.loadAllEmployeesExpenses();
      } else {
        await this.loadUserExpenses();
      }
    } catch (error: any) {
      console.error('Save Error:', error);
      this.showError(error.message || 'Failed to save expense');
    }
  }

  async deleteExpense(expenseId: string) {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await this.expensesService.deleteMyExpense(expenseId);
        this.showSuccess('Expense deleted successfully');
        await this.loadUserExpenses();
      } catch (error) {
        this.showError('Failed to delete expense');
      }
    }
  }

  private async loadAllEmployeesExpenses() {
    this.isLoading = true;
    try {
      const filters: any = {};
      if (this.selectedEmployeeId) {
        filters.employeeId = this.selectedEmployeeId;
      }

      if (this.filterFromDate) {
        filters.from = this.filterFromDate.toISOString().split('T')[0];
      }

      if (this.filterToDate) {
        filters.to = this.filterToDate.toISOString().split('T')[0];
      }

      if (this.selectedCategory) {
        filters.category = this.selectedCategory;
      }

      const [users, data] = await Promise.all([
        this.authService.getAllEmployees(),
        this.expensesService.getAllExpensesAdmin(filters)
      ]);

      const usersList = Array.isArray(users) ? users : [];
      const expensesList = Array.isArray(data) ? data : [];

      this.allEmployeesExpenses = expensesList.map(expense => {
        const user = usersList.find(u => Number(u.id) === Number(expense.employee_id));
        return {
          ...expense,
          employeeName: user ? user.name : 'Unknown'
        };
      });

      this.allEmployeesFiltered = [...this.allEmployeesExpenses];

      if (this.selectedEmployeeName && this.selectedEmployeeName.trim()) {
        this.applyEmployeeNameFilter();
      }

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error loading expenses:', error);
      this.showError('Failed to load employees expenses');
      this.allEmployeesExpenses = [];
      this.allEmployeesFiltered = [];
    } finally {
      this.isLoading = false;
    }
  }

  async applyAdminFilters() {
    await this.loadAllEmployeesExpenses();
  }

  async resetAdminFilters() {
    this.selectedEmployeeId = '';
    this.selectedEmployeeName = '';
    this.filterFromDate = null;
    this.filterToDate = null;
    this.selectedCategory = '';
    await this.loadAllEmployeesExpenses();
  }

  async deleteEmployeeExpense(expenseId: string, employeeName?: string) {
    const confirmMsg = employeeName
      ? `Delete expense for ${employeeName}?`
      : 'Delete this expense?';

    if (confirm(confirmMsg)) {
      try {
        if (this.isAdmin) {
          await this.expensesService.deleteExpenseAdmin(expenseId);
        } else {
          await this.expensesService.deleteMyExpense(expenseId);
        }

        this.showSuccess('Expense deleted successfully');

        if (this.isAdmin) {
          await this.loadAllEmployeesExpenses();
        } else {
          await this.loadUserExpenses();
        }
      } catch (error) {
        console.error('Delete error:', error);
        this.showError('Failed to delete expense');
      }
    }
  }

  applyEmployeeNameFilter() {
    const searchTerm = this.selectedEmployeeName.toLowerCase().trim();

    if (!searchTerm) {
      this.allEmployeesFiltered = [...this.allEmployeesExpenses];
    } else {
      this.allEmployeesFiltered = this.allEmployeesExpenses.filter(expense =>
        expense.employeeName && expense.employeeName.toLowerCase().includes(searchTerm)
      );
    }
    this.cdr.detectChanges();
  }

  refreshAdminData() {
    this.loadData();
  }

  hideDialog() {
    this.displayDialog = false;
  }

  private validateExpense(expense: ExpenseEntry): boolean {
    if (!expense.expenseDate) {
      this.showError('Please select an expense date');
      return false;
    }

    if (!expense.category) {
      this.showError('Please select a category');
      return false;
    }

    if (!expense.amount || expense.amount <= 0) {
      this.showError('Amount must be greater than 0');
      return false;
    }

    return true;
  }

  private showSuccess(msg: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: msg,
      life: 3000
    });
  }

  private showError(msg: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
      life: 4000
    });
  }
}
