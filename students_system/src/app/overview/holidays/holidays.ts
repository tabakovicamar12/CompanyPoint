import { Component, OnInit, inject } from '@angular/core';
import { HolidayService, HolidayRequestPayload } from '../../../services/holiday-service';
import { AuthService } from '../../../auth-service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { RouterModule } from "@angular/router";
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';

interface HolidayRequest {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  type: string;
  reviewComment: string;
  status?: string;
  reason?: string;
  numberOfDays?: number;
  employeeId?: number;
  employeeName?: string;
  userId?: string;
  userName?: string;
}

@Component({
  selector: 'app-holidays',
  imports: [
    TableModule, ButtonModule, DialogModule, DatePickerModule,
    CommonModule, FormsModule, TextareaModule, ToastModule,
    RouterModule, InputTextModule, CardModule, SelectModule, InputNumberModule, TagModule
  ],
  templateUrl: './holidays.html',
  styleUrl: './holidays.css',
})
export class Holidays implements OnInit {
  private holidayService = inject(HolidayService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = '';
  isAdmin: boolean = false;
  isUser: boolean = false;
  isLoading: boolean = false;

  userRequests: any[] = [];
  userStats: any = null;
  userFilterStatus: string = 'all';

  allRequests: any[] = [];
  allRequestsFiltered: any[] = [];
  selectedEmployeeId: string = '';
  selectedEmployeeName: string = '';
  selectedStatus: string = 'all';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  employees: any[] = [];
  selectedAdminStats: any = null;
  minDate: Date = new Date();
  minEndDate: Date | undefined;

  displayDialog: boolean = false;
  displayReviewDialog: boolean = false;
  isEdit: boolean = false;

  requestTypes: any[] = [
    { label: 'Vacation', value: 'Vacation' },
    { label: 'Sick Leave', value: 'Sick Leave' },
    { label: 'Personal Leave', value: 'Personal Leave' },
    { label: 'Maternity Leave', value: 'Maternity Leave' },
    { label: 'Bereavement', value: 'Bereavement' },
    { label: 'Other', value: 'Other' }
  ];

  statusOptions: any[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
  ];

  currentRequest: HolidayRequest = {
    id: '',
    startDate: new Date(),
    endDate: new Date(),
    type: '',
    reviewComment: '',
  };

  reviewRequest: any = {
    id: '',
    status: '',
    adminComment: ''
  };

  constructor() {
    this.minDate.setHours(0, 0, 0, 0);
  }

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
        await Promise.all([
          this.loadUserRequests(),
          this.loadUserStats()
        ]);
      } else if (this.isAdmin) {
        await Promise.all([
          this.loadAllRequests(),
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
      console.error('Failed to load employee list:', error);
    }
  }

  private async loadUserRequests() {
    try {
      const statusMap: any = {
        'all': 'all',
        'pending': 'pending',
        'approved': 'approved',
        'rejected': 'rejected'
      };
      const backendStatus = statusMap[this.userFilterStatus] || this.userFilterStatus;
      const data = await this.holidayService.getMyRequests(backendStatus);
      const list = Array.isArray(data) ? data : [];

      this.userRequests = list.map((r: any) => {
        let normalizedType = r.type ?? r.holidayType ?? r.requestType ?? r.reason ?? '';
        const match = this.requestTypes.find(rt => (rt.value || '').toString().toLowerCase() === (normalizedType || '').toString().toLowerCase() || (rt.label || '').toString().toLowerCase() === (normalizedType || '').toString().toLowerCase());
        if (match) normalizedType = match.value;

        const normalizedComment = r.comment ?? r.reviewComment ?? r.reason ?? '';
        return {
          ...r,
          type: normalizedType,
          reason: normalizedComment,
          reviewComment: r.reviewComment ?? '',
        };
      });
    } catch (error) {
      this.showError('Could not load your holiday requests');
      this.userRequests = [];
    }
  }

  private async loadUserStats() {
    try {
      const data = await this.holidayService.getMyStats();
      this.userStats = data || {};
    } catch (error) {
      this.userStats = {};
    }
  }

  showAddDialog() {
    this.isEdit = false;
    this.currentRequest = {
      id: '',
      startDate: new Date(),
      endDate: new Date(),
      type: '',
      reviewComment: '',
    };
    this.displayDialog = true;
  }

  editRequest(request: any) {
    this.isEdit = true;
    let normalizedType = request.type ?? request.holidayType ?? request.requestType ?? request.reason ?? '';
    const match = this.requestTypes.find(rt => (rt.value || '').toString().toLowerCase() === (normalizedType || '').toString().toLowerCase() || (rt.label || '').toString().toLowerCase() === (normalizedType || '').toString().toLowerCase());
    if (match) normalizedType = match.value;
    const normalizedComment = request.reason ?? request.comment ?? request.reviewComment ?? '';

    this.currentRequest = {
      id: request.id,
      startDate: new Date(request.startDate || request.start_date),
      endDate: new Date(request.endDate || request.end_date),
      type: normalizedType,
      reviewComment: normalizedComment,
    };

    this.cdr.detectChanges();
    this.displayDialog = true;
  }

  async saveRequest() {
    if (!this.validateRequest(this.currentRequest)) {
      return;
    }

    const ensureDate = (date: any): string => {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString().split('T')[0];
    };

    const payload: any = {
      startDate: ensureDate(this.currentRequest.startDate),
      endDate: ensureDate(this.currentRequest.endDate),
      reason: this.currentRequest.type
    };

    if (this.currentRequest.reviewComment) {
      payload.reviewComment = this.currentRequest.reviewComment;
    }

    try {
      if (this.isEdit) {
        await this.holidayService.updateRequest(this.currentRequest.id, payload);
        this.showSuccess('Holiday request updated successfully');
      } else {
        await this.holidayService.createRequest(payload);
        this.showSuccess('Holiday request created successfully');
      }

      this.displayDialog = false;
      await Promise.all([
        this.loadUserRequests(),
        this.loadUserStats()
      ]);
    } catch (error: any) {
      console.error('Save Error:', error);
      this.showError(error.message || 'Failed to save holiday request');
    }
  }

  async deleteRequest(requestId: string) {
    if (confirm('Are you sure you want to delete this holiday request?')) {
      try {
        await this.holidayService.deleteRequest(requestId);
        this.showSuccess('Holiday request deleted successfully');
        await this.loadUserRequests();
        await this.loadUserStats();
      } catch (error) {
        this.showError('Failed to delete holiday request');
      }
    }
  }

  async changeStatusFilter(status: string) {
    this.userFilterStatus = status;
    await this.loadUserRequests();
    this.cdr.detectChanges();
  }

  private async loadAllRequests() {
    try {
      const filters: any = {};

      if (this.selectedEmployeeId) {
        filters.userId = this.selectedEmployeeId;
      }

      if (this.selectedEmployeeName && this.selectedEmployeeName.trim()) {
      }

      if (this.selectedStatus !== 'all') {
        filters.status = this.selectedStatus;
      }

      if (this.filterStartDate) {
        filters.startDate = this.filterStartDate.toISOString().split('T')[0];
      }

      if (this.filterEndDate) {
        filters.endDate = this.filterEndDate.toISOString().split('T')[0];
      }

      const [users, data] = await Promise.all([
        this.authService.getAllEmployees(),
        this.holidayService.getAllRequestsAdmin(filters)
      ]);

      const usersList = Array.isArray(users) ? users : [];
      const requestsList = Array.isArray(data) ? data : [];

      this.allRequests = requestsList.map(req => {
        const empId = req.userId ?? req.employee_id ?? req.employeeId ?? null;
        const user = usersList.find(u => u && (String(u.id) === String(empId) || Number(u.id) === Number(empId)));
        const resolvedName = user ? user.name : (req.userName || req.employeeName || req.employee_name || 'Unknown');

        let normalizedType = req.type ?? req.holidayType ?? req.requestType ?? req.reason ?? '';
        const match = this.requestTypes.find(rt => (rt.value || '').toString().toLowerCase() === (normalizedType || '').toString().toLowerCase() || (rt.label || '').toString().toLowerCase() === (normalizedType || '').toString().toLowerCase());
        if (match) normalizedType = match.value;

        return {
          ...req,
          type: normalizedType,
          userId: empId ?? req.userId,
          employee_id: empId ?? req.employee_id,
          employeeName: resolvedName,
          employee_name: resolvedName,
          userName: resolvedName
        };
      });

      this.allRequestsFiltered = [...this.allRequests];

      if (this.selectedEmployeeName && this.selectedEmployeeName.trim()) {
        this.applyEmployeeNameFilter();
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      this.showError('Failed to load holiday requests');
      this.allRequests = [];
      this.allRequestsFiltered = [];
    }
  }

  async applyAdminFilters() {
    await new Promise<void>(res => setTimeout(res, 0));
    this.cdr.detectChanges();
    await this.loadAllRequests();
  }

  async resetAdminFilters() {
    this.selectedEmployeeId = '';
    this.selectedEmployeeName = '';
    this.selectedStatus = 'all';
    this.filterStartDate = null;
    this.filterEndDate = null;
    await this.loadAllRequests();
  }

  applyEmployeeNameFilter() {
    const searchTerm = (this.selectedEmployeeName || '').toLowerCase().trim();

    if (!searchTerm) {
      this.allRequestsFiltered = [...this.allRequests];
    } else {
      this.allRequestsFiltered = this.allRequests.filter(req =>
        (req.userName || req.employeeName || req.employee_name || '')
          .toLowerCase()
          .includes(searchTerm)
      );
    }
  }

  openReviewDialog(request: any) {
    this.reviewRequest = {
      id: request.id,
      status: request.status || 'pending',
      adminComment: '',
      employeeName: request.userName || request.employeeName || request.employee_name || ''
    };
    this.displayReviewDialog = true;
  }

  async submitReview() {
    if (!this.reviewRequest.status) {
      this.showError('Please select a status');
      return;
    }

    try {
      const reviewStatus = this.reviewRequest.status === 'approved' ? 'approved' : 'rejected';
      await this.holidayService.reviewRequestAdmin(
        this.reviewRequest.id,
        reviewStatus,
        this.reviewRequest.adminComment || undefined
      );
      this.showSuccess('Holiday request reviewed successfully');
      this.displayReviewDialog = false;
      this.selectedAdminStats = null;
      await this.loadAllRequests();
    } catch (error: any) {
      console.error('Review Error:', error);
      this.showError(error.message || 'Failed to review request');
    }
  }

  async loadEmployeeStats(employeeId: string) {
    try {
      if (!employeeId) {
        this.showError('Please select an employee first');
        return;
      }
      this.selectedAdminStats = await this.holidayService.getUserStatsByIdAdmin(employeeId);
      this.showSuccess('Employee statistics loaded successfully');
    } catch (error) {
      console.error('Failed to load employee stats:', error);
      this.showError('Failed to load employee statistics');
      this.selectedAdminStats = null;
    }
  }

  async deleteRequestAdmin(requestId: string, employeeName?: string) {
    const confirmMsg = employeeName
      ? `Delete holiday request for ${employeeName}?`
      : 'Delete this holiday request?';

    if (confirm(confirmMsg)) {
      try {
        await this.holidayService.deleteRequestAdmin(requestId);
        this.showSuccess('Holiday request deleted successfully');
        this.selectedAdminStats = null;
        await this.loadAllRequests();
      } catch (error) {
        console.error('Delete error:', error);
        this.showError('Failed to delete holiday request');
      }
    }
  }

  refreshAdminData() {
    this.loadData();
  }

  hideDialog() {
    this.displayDialog = false;
  }

  hideReviewDialog() {
    this.displayReviewDialog = false;
  }

  private validateRequest(request: HolidayRequest): boolean {
    if (!request.startDate) {
      this.showError('Please select a start date');
      return false;
    }

    if (!request.endDate) {
      this.showError('Please select an end date');
      return false;
    }

    if (new Date(request.endDate) < new Date(request.startDate)) {
      this.showError('End date must be after start date');
      return false;
    }

    if (!request.type) {
      this.showError('Please select a holiday type');
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

  onStartDateSelect() {
    if (this.currentRequest.startDate) {
      this.minEndDate = new Date(this.currentRequest.startDate);
    }
  }
}
