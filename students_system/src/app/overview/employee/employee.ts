import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { EmployeeService, Employee } from '../../../services/employee-service';
import { AuthService } from '../../../auth-service';
import { LogsService } from '../../../services/logs-service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Menu } from '../menu/menu';
import { RouterModule } from "@angular/router";
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-employee',
  imports: [
    TableModule, ButtonModule, DialogModule, InputTextModule,
    CommonModule, FormsModule, InputNumberModule, TextareaModule,
    ToastModule, RouterModule, CardModule, SelectModule, TagModule
],
  providers: [LogsService],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class EmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private logsService = inject(LogsService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = '';
  isAdmin: boolean = false;
  isUser: boolean = false;
  isLoading: boolean = false;
  currentUserId: string = '';

  allEmployees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedEmployees: Employee[] = [];

  displayDialog: boolean = false;
  displayBulkDialog: boolean = false;
  displayLogsDialog: boolean = false;
  isEdit: boolean = false;
  allLogs: any[] = [];

  searchText: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';

  departments: any[] = [
    { label: 'All Departments', value: '' },
    { label: 'IT', value: 'IT' },
    { label: 'HR', value: 'HR' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Marketing', value: 'Marketing' }
  ];

  statusOptions: any[] = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'On Leave', value: 'on_leave' }
  ];

  currentEmployee: Employee = {
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    status: 'active',
    hireDate: new Date().toISOString().split('T')[0]
  };

  bulkImportData: string = '';

  ngOnInit() {
    this.initializeUserRole();
    this.loadData();
  }

  private initializeUserRole() {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('id');
    this.userRole = role || '';
    this.currentUserId = userId || '';
    this.isAdmin = this.userRole === 'admin';
    this.isUser = this.userRole === 'user';
  }

  private async loadData() {
    this.isLoading = true;
    try {
      if (this.isAdmin) {
        await this.loadAllEmployees();
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      this.showError('Failed to load data');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAllEmployees() {
    try {
      const data = await this.employeeService.getAllEmployees();
      this.allEmployees = Array.isArray(data) ? data : [];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading employees:', error);
      this.showError('Failed to load employees');
      this.allEmployees = [];
    }
  }

  applyFilters() {
    this.filteredEmployees = this.allEmployees.filter(emp => {
      const matchesSearch = !this.searchText || 
        emp.firstName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        emp.email.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesDept = !this.selectedDepartment || emp.department === this.selectedDepartment;
      const matchesStatus = !this.selectedStatus || emp.status === this.selectedStatus;
      
      return matchesSearch && matchesDept && matchesStatus;
    });
  }

  resetFilters() {
    this.searchText = '';
    this.selectedDepartment = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  showAddDialog() {
    this.isEdit = false;
    this.currentEmployee = {
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      department: '',
      status: 'active',
      hireDate: new Date().toISOString().split('T')[0]
    };
    this.displayDialog = true;
  }

  editEmployee(employee: Employee) {
    this.isEdit = true;
    this.currentEmployee = { ...employee };
    this.displayDialog = true;
  }

  async saveEmployee() {
    if (!this.validateEmployee(this.currentEmployee)) {
      return;
    }

    try {
      if (this.isEdit && this.currentEmployee.id) {
        await this.employeeService.updateEmployee(this.currentEmployee.id, this.currentEmployee);
        this.showSuccess('Employee updated successfully');
      } else {
        await this.employeeService.createEmployee(this.currentEmployee);
        this.showSuccess('Employee created successfully');
      }

      this.displayDialog = false;
      await this.loadAllEmployees();
    } catch (error: any) {
      console.error('Save Error:', error);
      this.showError(error.message || 'Failed to save employee');
    }
  }

  async deleteEmployee(employeeId: number | undefined, employeeName?: string) {
    if (!employeeId) return;

    const confirmMsg = employeeName
      ? `Delete employee ${employeeName}?`
      : 'Delete this employee?';

    if (confirm(confirmMsg)) {
      try {
        await this.employeeService.deleteEmployee(employeeId);
        this.showSuccess('Employee deleted successfully');
        await this.loadAllEmployees();
      } catch (error: any) {
        console.error('Delete error:', error);
        this.showError(error.message || 'Failed to delete employee');
      }
    }
  }

  async deleteByDepartment() {
    if (!this.selectedDepartment) {
      this.showError('Please select a department');
      return;
    }

    if (confirm(`Delete all employees in ${this.selectedDepartment}?`)) {
      try {
        await this.employeeService.deleteByDepartment(this.selectedDepartment);
        this.showSuccess(`All employees in ${this.selectedDepartment} deleted`);
        await this.loadAllEmployees();
      } catch (error: any) {
        this.showError(error.message || 'Failed to delete department employees');
      }
    }
  }

  showBulkImportDialog() {
    this.bulkImportData = '';
    this.displayBulkDialog = true;
  }

  async bulkImport() {
    if (!this.bulkImportData.trim()) {
      this.showError('Please paste employee data');
      return;
    }

    try {
      const lines = this.bulkImportData.trim().split('\n');
      const employees: Employee[] = lines.map(line => {
        const [firstName, lastName, email, position, department, status] = line.split('\t');
        return {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          position: position.trim(),
          department: department.trim(),
          status: status?.trim() || 'active',
          hireDate: new Date().toISOString().split('T')[0]
        };
      });

      const result = await this.employeeService.bulkImport(employees);
      this.showSuccess(`Imported ${result.count} employees successfully`);
      this.displayBulkDialog = false;
      await this.loadAllEmployees();
    } catch (error: any) {
      console.error('Bulk import error:', error);
      this.showError(error.message || 'Bulk import failed');
    }
  }

  refreshData() {
    this.loadData();
  }

  hideDialog() {
    this.displayDialog = false;
  }

  hideBulkDialog() {
    this.displayBulkDialog = false;
  }

  async loadLogs() {
    try {
      // Veći raspon - od 2025 do 2027
      const from = '2025-01-01';
      const to = '2027-12-31';

      await this.logsService.syncLogs();
      const data = await this.logsService.getLogs(from, to);
      this.allLogs = data || [];
      this.displayLogsDialog = true;
      this.cdr.markForCheck();
    } catch (error) {
      console.error(error);
      this.showError('Failed to load logs');
    }
  }

  async clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
      try {
        const success = await this.logsService.clearLogs();
        if (success) {
          this.showSuccess('Logs cleared successfully');
          this.allLogs = [];
          this.cdr.markForCheck();
        } else {
          this.showError('Failed to clear logs');
        }
      } catch (error) {
        console.error(error);
        this.showError('Failed to clear logs');
      }
    }
  }

  hideLogsDialog() {
    this.displayLogsDialog = false;
  }

  private validateEmployee(employee: Employee): boolean {
    if (!employee.firstName?.trim()) {
      this.showError('First name is required');
      return false;
    }

    if (!employee.lastName?.trim()) {
      this.showError('Last name is required');
      return false;
    }

    if (!employee.email?.trim()) {
      this.showError('Email is required');
      return false;
    }

    if (!employee.position?.trim()) {
      this.showError('Position is required');
      return false;
    }

    if (!employee.department?.trim()) {
      this.showError('Department is required');
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
