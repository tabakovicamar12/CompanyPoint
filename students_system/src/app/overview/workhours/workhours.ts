import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { WorkHoursService } from '../../../services/work-hours-service';
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
import { RouterModule } from "@angular/router";
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

interface WorkEntry {
  id: string;
  workDate: Date;
  hours: number;
  description: string;
  employeeId?: number;
  employeeName?: string;
}

export interface WorkLogPayload {
  workDate: string;
  hours: number;
  description?: string;
  taskId?: number | null;
  workType?: string | null;
}

@Component({
  selector: 'app-workhours',
  standalone: true,
  imports: [
    TableModule, ButtonModule, DialogModule, DatePickerModule,
    CommonModule, FormsModule, InputNumberModule, TextareaModule,
    ToastModule, RouterModule, InputTextModule, CardModule, SelectModule
  ],
  templateUrl: './workhours.html',
  styleUrl: './workhours.css',
})
export class Workhours implements OnInit {
  private workService = inject(WorkHoursService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = '';
  isAdmin: boolean = false;
  isUser: boolean = false;
  isLoading: boolean = false;

  userWorkEntries: WorkEntry[] = [];
  filteredUserEntries: WorkEntry[] = [];

  allEmployeesEntries: any[] = [];
  filteredAllEntries: any[] = [];
  monthlyReport: any[] = [];
  selectedEmployeeName: string = '';
  tableSearchText: string = '';
  filterFromDate: Date | null = null;
  filterToDate: Date | null = null;

  displayDialog: boolean = false;
  isEdit: boolean = false;
  employees: any[] = [];

  currentEntry: WorkEntry = {
    id: '',
    workDate: new Date(),
    hours: 0,
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
    this.cdr.detectChanges();
    try {
      if (this.isUser) {
        await this.loadUserWorkHours();
      } else if (this.isAdmin) {
        await Promise.all([
          this.loadAllEmployeesHours(),
          this.loadEmployeesForDropdown()
        ]);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      this.showError('Failed to load data');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadEmployeesForDropdown() {
    try {
      this.employees = await this.authService.getAllEmployees();
    } catch (error) {
    }
  }

  private async loadUserWorkHours() {
    try {
      const data = await this.workService.getMyHours();
      this.userWorkEntries = Array.isArray(data) ? data : [];
      this.applyUserFilters();
    } catch (error) {
      this.showError('Could not load your work hours');
      this.userWorkEntries = [];
      this.filteredUserEntries = [];
    }
  }

  showAddDialog() {
    this.isEdit = false;
    this.currentEntry = {
      id: '',
      workDate: new Date(),
      hours: 0,
      description: '',
    };
    this.displayDialog = true;
  }

  editWorkEntry(entry: any) {
    this.isEdit = true;
    this.currentEntry = {
      id: entry.id,
      workDate: new Date(entry.work_date),
      hours: entry.hours,
      description: entry.description || '',
    };
    this.displayDialog = true;
  }

  editWorkEntryAdmin(entry: any) {
    this.isEdit = true;
    this.currentEntry = {
      id: entry.id,
      employeeName: entry.employeeName,
      workDate: new Date(entry.work_date),
      hours: entry.hours,
      description: entry.description || '',
    };
    this.displayDialog = true;
  }

  async saveWorkEntry() {
    if (!this.validateEntry(this.currentEntry)) {
      return;
    }

    const payload: any = {
      workDate: this.currentEntry.workDate.toISOString().split('T')[0],
      hours: Number(this.currentEntry.hours),
      description: this.currentEntry.description || '',
      taskId: null,
      workType: 'Regular'
    };

    if (this.isAdmin && !this.isEdit) {
      payload.employeeId = this.currentEntry.employeeId;
    }

    try {
      if (this.isEdit) {
        if (this.isAdmin) {
          await this.workService.updateHoursByAdmin(this.currentEntry.id, payload);
          this.showSuccess('Work entry updated by Admin');
          await this.refreshAdminData();
        } else {
          await this.workService.updateMyHours(this.currentEntry.id, payload);
          this.showSuccess('Work entry updated successfully');
        }
      } else {
        if (this.isAdmin) {
          if (!payload.employeeId) {
            this.showError('Please select an employee');
            return;
          }
          await this.workService.logForEmployeeAdmin(payload);
          await this.refreshAdminData();
          this.showSuccess('Work hours logged for employee');

        } else {
          await this.workService.logWorkHours(payload);
          this.showSuccess('Work hours logged successfully');
        }
      }

      this.displayDialog = false;
      if (this.isAdmin) {
        this.isLoading = false;
        await this.loadAllEmployeesHours();
        this.cdr.detectChanges();
      } else {
        this.isLoading = false;
        await this.loadUserWorkHours();
        this.cdr.detectChanges();
      }

    } catch (error: any) {
      console.error('Save Error:', error);
      this.showError(error.message || 'Failed to save work entry.');
    }
  }

  async deleteWorkEntry(entryId: string) {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await this.workService.deleteMyHours(entryId);
        this.showSuccess('Work entry deleted successfully');
        await this.loadUserWorkHours();
        this.cdr.detectChanges();
      } catch (error) {
        this.showError('Failed to delete work entry');
      }
    }
  }

  private async loadAllEmployeesHours() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const filters: any = {};
      let usersList = this.employees;
      if (usersList.length === 0) {
        const users = await this.authService.getAllEmployees();
        usersList = Array.isArray(users) ? users : [];
        this.employees = usersList;
      }

      if (this.selectedEmployeeName) {
        const foundUser = usersList.find(u =>
          u.name === this.selectedEmployeeName || u.id === this.selectedEmployeeName
        );

        if (foundUser) {
          filters.employeeId = foundUser.id;
        }
      }

      if (this.filterFromDate) {
        filters.from = this.filterFromDate.toISOString().split('T')[0];
      }
      if (this.filterToDate) {
        filters.to = this.filterToDate.toISOString().split('T')[0];
      }

      const data = await this.workService.getAllEmployeesHours(filters);
      const hoursList = Array.isArray(data) ? data : [];

      this.allEmployeesEntries = hoursList.map(entry => {
        const user = usersList.find(u => u.id === entry.employee_id);
        return {
          ...entry,
          employeeName: user ? user.name : 'Unknown User'
        };
      });

      this.applyTableFilters();
      this.isLoading = false;
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error loading employees work hours:', error);
      this.showError('Failed to load employees work hours');
      this.allEmployeesEntries = [];
      this.filteredAllEntries = [];
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async applyAdminFilters() {
    this.loadAllEmployeesHours();
  }

  async resetAdminFilters() {
    this.selectedEmployeeName = '';
    this.filterFromDate = null;
    this.filterToDate = null;
    this.tableSearchText = '';
    this.loadAllEmployeesHours();
  }

  applyUserFilters() {
    if (!this.tableSearchText.trim()) {
      this.filteredUserEntries = [...this.userWorkEntries];
      return;
    }

    const search = this.tableSearchText.toLowerCase();
    this.filteredUserEntries = this.userWorkEntries.filter(entry => {
      const date = (entry.workDate || '').toString().toLowerCase();
      const desc = (entry.description || '').toLowerCase();
      return date.includes(search) || desc.includes(search);
    });
  }

  applyTableFilters() {
    let filtered = [...this.allEmployeesEntries];

    if (this.selectedEmployeeName.trim()) {
      const search = this.selectedEmployeeName.toLowerCase();
      filtered = filtered.filter(entry => {
        const name = (entry.employeeName || entry.employee_name || '').toLowerCase();
        return name.includes(search);
      });
    }

    if (this.tableSearchText.trim()) {
      const search = this.tableSearchText.toLowerCase();
      filtered = filtered.filter(entry => {
        const id = (entry.employee_id || entry.employeeId || '').toString().toLowerCase();
        const date = (entry.work_date || '').toString().toLowerCase();
        const desc = (entry.description || '').toLowerCase();
        return id.includes(search) || date.includes(search) || desc.includes(search);
      });
    }

    this.filteredAllEntries = filtered;
  }

  onTableSearchChange() {
    if (this.isUser) {
      this.applyUserFilters();
    } else if (this.isAdmin) {
      this.applyTableFilters();
    }
  }

  onEmployeeNameChange() {
    this.applyTableFilters();
  }

  async deleteEmployeeEntry(entryId: string, employeeName?: string) {
    const confirmMsg = employeeName
      ? `Delete work entry for ${employeeName}?`
      : 'Delete this work entry?';

    if (confirm(confirmMsg)) {
      try {
        if (this.isAdmin) {
          await this.workService.deleteHoursByAdmin(entryId);
          await this.refreshAdminData();
        } else {
          await this.workService.deleteMyHours(entryId);
        }

        this.showSuccess('Work entry deleted successfully');

        if (this.isAdmin) {
          await this.loadAllEmployeesHours();
          await this.refreshAdminData();
        } else {
          await this.loadUserWorkHours();
          this.cdr.detectChanges();
        }

      } catch (error) {
        console.error('Delete error:', error);
        this.showError('Failed to delete work entry');
      }
    }
  }

  refreshAdminData() {
    this.loadData();
  }

  hideDialog() {
    this.displayDialog = false;
  }

  private validateEntry(entry: WorkEntry): boolean {
    if (!entry.workDate) {
      this.showError('Please select a work date');
      return false;
    }

    if (!entry.hours || entry.hours <= 0) {
      this.showError('Hours must be greater than 0');
      return false;
    }

    if (entry.hours > 24) {
      this.showError('Hours cannot exceed 24');
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
