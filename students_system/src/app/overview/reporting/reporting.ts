import { Component, OnInit, inject } from '@angular/core';
import { ReportingService, Report, Log } from '../../../services/reporting-service';
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
import { TagModule } from 'primeng/tag';
import { ChangeDetectorRef } from '@angular/core';

interface ReportEntry {
  id: string;
  userId: string;
  userName?: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
  source: 'workhours' | 'manual';
  status: 'draft' | 'approved' | 'paid';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-reporting',
  imports: [
    TableModule, ButtonModule, DialogModule, DatePickerModule,
    CommonModule, FormsModule, InputNumberModule, TextareaModule,
    ToastModule, RouterModule, InputTextModule, CardModule, SelectModule, TagModule
],
  templateUrl: './reporting.html',
  styleUrl: './reporting.css',
})
export class Reporting implements OnInit {
  private reportingService = inject(ReportingService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = '';
  isAdmin: boolean = false;
  isUser: boolean = false;
  isLoading: boolean = false;
  currentUserId: string = '';

  userReports: ReportEntry[] = [];
  allReports: ReportEntry[] = [];
  allLogs: Log[] = [];
  allReportsFiltered: ReportEntry[] = [];
  selectedEmployeeId: string = '';
  selectedEmployeeName: string = '';
  selectedStatus: string = 'all';
  filterPeriodStart: Date | null = null;
  filterPeriodEnd: Date | null = null;

  employees: any[] = [];

  displayDialog: boolean = false;
  displayLogsDialog: boolean = false;
  isEdit: boolean = false;
  isManualReport: boolean = false;

  statusOptions: any[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Approved', value: 'approved' },
    { label: 'Paid', value: 'paid' }
  ];

  sourceOptions: any[] = [
    { label: 'Work Hours', value: 'workhours' },
    { label: 'Manual', value: 'manual' }
  ];

  currentReport: ReportEntry = {
    id: '',
    userId: '',
    periodStart: '',
    periodEnd: '',
    totalHours: 0,
    hourlyRate: 0,
    totalPay: 0,
    source: 'manual',
    status: 'draft',
    notes: ''
  };

  currentUser: any = null;

  ngOnInit() {
    this.initializeUserRole();
    this.loadData();
  }

  private initializeUserRole() {
    const role = localStorage.getItem('role');
    const storedId =
      localStorage.getItem('employeeId') ||
      localStorage.getItem('id') ||
      localStorage.getItem('userId');
    this.userRole = role || '';
    this.currentUserId = storedId || '';
    this.isAdmin = this.userRole === 'admin';
    this.isUser = this.userRole === 'user';
  }

  private async loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      if (this.isUser) {
        await this.loadUserReports();
      } else if (this.isAdmin) {
        await this.loadEmployeesForDropdown();
        await this.loadAllReports();
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
      console.error('Failed to load employee list:', error);
    }
  }

  private async loadUserReports() {
    try {
      const data = await this.reportingService.getAllReports({ userId: this.currentUserId, employeeId: this.currentUserId });
      const reports = Array.isArray(data) ? data : [];
      this.userReports = reports.map((r: any) => {
        const rawUserId = r.userId ?? r.employeeId ?? r.ownerId ?? (r.user && r.user.id) ?? '';
        const userName = r.userName ?? (r.user && r.user.name) ?? r.employeeName ?? '';
        return {
          ...r,
          userId: rawUserId,
          userName: userName
        };
      });
    } catch (error) {
      this.showError('Could not load your reports');
      this.userReports = [];
    }
  }

  private async loadAllReports() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const filters: any = {};

      if (this.selectedEmployeeId) {
        const foundUser = this.employees.find(u =>
          u.name === this.selectedEmployeeId || u.id === this.selectedEmployeeId
        );
        if (foundUser) {
          filters.userId = foundUser.id;
        }
      }

      if (this.selectedStatus !== 'all') {
        filters.status = this.selectedStatus;
      }

      if (this.filterPeriodStart) {
        filters.periodStart = this.filterPeriodStart.toISOString().split('T')[0];
      }

      if (this.filterPeriodEnd) {
        filters.periodEnd = this.filterPeriodEnd.toISOString().split('T')[0];
      }

      const [users, data] = await Promise.all([
        await this.authService.getAllEmployees(),
        await this.reportingService.getAllReports(filters)
      ]);

      this.employees = Array.isArray(users) ? users : [];
      const reportsList = Array.isArray(data) ? data : [];

      this.allReports = reportsList.map((report: any) => {
        const rawUserId = report.userId ?? report.employeeId ?? report.ownerId ?? (report.user && report.user.id) ?? '';
        const user = this.employees.find(emp => String(emp.id) === String(rawUserId) || String(emp.id) === String(report.userId) || String(emp.id) === String(report.employeeId));
        const userName = report.userName ?? (report.user && report.user.name) ?? (user ? user.name : 'Unknown User');
        return {
          ...report,
          userId: rawUserId || report.userId || report.employeeId || '',
          userName: userName
        };
      });

      this.allReportsFiltered = [...this.allReports];

      if (this.selectedEmployeeName && this.selectedEmployeeName.trim()) {
        this.applyEmployeeNameFilter();
      }

    } catch (error) {
      console.error('Error loading reports:', error);
      this.showError('Failed to load reports');
      this.allReports = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadLogs() {
    try {
      const data = await this.reportingService.getLogs();
      this.allLogs = Array.isArray(data) ? data : [];
      this.displayLogsDialog = true;
    } catch (error) {
      this.showError('Failed to load logs');
    }
  }

  showGenerateDialog() {
    this.isEdit = false;
    this.isManualReport = false;
    this.currentReport = {
      id: '',
      userId: '',
      periodStart: '',
      periodEnd: '',
      totalHours: 0,
      hourlyRate: 0,
      totalPay: 0,
      source: 'workhours',
      status: 'draft',
      notes: ''
    };
    this.displayDialog = true;
  }

  showManualReportDialog() {
    this.isEdit = false;
    this.isManualReport = true;
    this.currentReport = {
      id: '',
      userId: '',
      periodStart: '',
      periodEnd: '',
      totalHours: 0,
      hourlyRate: 0,
      totalPay: 0,
      source: 'manual',
      status: 'draft',
      notes: ''
    };
    this.displayDialog = true;
  }

  editReport(report: any) {
    this.isEdit = true;
    this.isManualReport = report.source === 'manual';
    this.currentReport = {
      id: report.id,
      userId: report.userId,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      totalHours: report.totalHours,
      hourlyRate: report.hourlyRate,
      totalPay: report.totalPay,
      source: report.source,
      status: report.status,
      notes: report.notes || ''
    };
    this.displayDialog = true;
  }

  async saveReport() {
    if (!this.validateReport(this.currentReport)) {
      return;
    }

    const payload: any = {
      periodStart: this.currentReport.periodStart,
      periodEnd: this.currentReport.periodEnd,
      hourlyRate: Number(this.currentReport.hourlyRate),
      totalHours: Number(this.currentReport.totalHours),
      notes: this.currentReport.notes || ''
    };

    if (this.isAdmin && !this.isEdit) {
      const userId = this.currentReport.userId ? String(this.currentReport.userId) : '';
      if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
        this.showError('Please select an employee');
        return;
      }
      payload.userId = userId;
    } else if (this.isUser) {
      payload.userId = this.currentUserId;
    }


    try {
      if (this.isEdit) {
        await this.reportingService.updateReport(this.currentReport.id, payload);
        this.showSuccess('Report updated successfully');
      } else {
        if (this.isManualReport) {
          payload.source = 'manual';
          payload.totalPay = payload.totalHours * payload.hourlyRate;
          await this.reportingService.createManualReport(payload);
          this.showSuccess('Manual report created successfully');
        } else {
          await this.reportingService.fetchFromWorkhours(payload);
          this.showSuccess('Report generated from work hours successfully');
        }
      }

      this.displayDialog = false;
      if (this.isAdmin) {
        await this.loadAllReports();
      } else {
        await this.loadUserReports();
      }
    } catch (error: any) {
      console.error('Save Error:', error);
      this.showError(error.message || 'Failed to save report');
    }
  }

  async updateReportStatus(reportId: string, newStatus: string) {
    try {
      await this.reportingService.updateStatus(reportId, newStatus);
      this.showSuccess(`Report status updated to ${newStatus}`);
      await this.loadAllReports();
    } catch (error: any) {
      this.showError(error.message || 'Failed to update report status');
    }
  }

  async deleteReport(reportId: string, periodStart?: string) {
    const confirmMsg = periodStart
      ? `Delete report for period starting ${periodStart}?`
      : 'Delete this report?';

    if (confirm(confirmMsg)) {
      try {
        await this.reportingService.deleteReport(reportId);
        this.showSuccess('Report deleted successfully');
        if (this.isAdmin) {
          await this.loadAllReports();
        } else {
          await this.loadUserReports();
        }
      } catch (error) {
        console.error('Delete error:', error);
        this.showError('Failed to delete report');
      }
    }
  }

  async applyFilters() {
    if (this.employees.length === 0) {
      await this.loadEmployeesForDropdown();
    }
    await new Promise<void>(res => setTimeout(res, 0));
    await this.loadAllReports();
  }

  async resetFilters() {
    this.selectedEmployeeId = '';
    this.selectedEmployeeName = '';
    this.selectedStatus = 'all';
    this.filterPeriodStart = null;
    this.filterPeriodEnd = null;
    if (this.employees.length === 0) {
      await this.loadEmployeesForDropdown();
    }
    await this.loadAllReports();
  }

  applyEmployeeNameFilter() {
    const searchTerm = (this.selectedEmployeeName || '').toLowerCase().trim();

    if (!searchTerm) {
      this.allReportsFiltered = [...this.allReports];
    } else {
      this.allReportsFiltered = this.allReports.filter(r => (r.userName || '').toLowerCase().includes(searchTerm));
    }
  }

  async syncLogs() {
    try {
      await this.reportingService.syncLogs();
      this.showSuccess('Logs synced successfully');
      await this.loadLogs();
    } catch (error) {
      this.showError('Failed to sync logs');
    }
  }

  async clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
      try {
        await this.reportingService.clearLogs();
        this.showSuccess('Logs cleared successfully');
        this.allLogs = [];
      } catch (error) {
        this.showError('Failed to clear logs');
      }
    }
  }

  refreshData() {
    this.loadData();
  }

  hideDialog() {
    this.displayDialog = false;
  }

  hideLogsDialog() {
    this.displayLogsDialog = false;
  }

  private getEmployeeName(userId: string | number): string {
    const id = String(userId);
    const employee = this.employees.find(emp => String(emp.id) === id);
    return employee ? employee.name : userId.toString();
  }

  private validateReport(report: ReportEntry): boolean {
    if (this.isAdmin && !this.isEdit && !report.userId) {
      this.showError('Please select an employee');
      return false;
    }

    if (!report.periodStart) {
      this.showError('Please select a period start date');
      return false;
    }

    if (!report.periodEnd) {
      this.showError('Please select a period end date');
      return false;
    }

    if (new Date(report.periodEnd) < new Date(report.periodStart)) {
      this.showError('Period end date must be after start date');
      return false;
    }

    if (!report.hourlyRate || report.hourlyRate <= 0) {
      this.showError('Hourly rate must be greater than 0');
      return false;
    }

    if (this.isManualReport) {
      if (!report.totalHours || report.totalHours <= 0) {
        this.showError('Total hours must be greater than 0');
        return false;
      }
    }

    return true;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'draft': return 'warn';
      case 'approved': return 'success';
      case 'paid': return 'info';
      default: return 'secondary';
    }
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
