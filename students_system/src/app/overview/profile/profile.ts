import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth-service';
import { LogsService } from '../../../services/logs-service';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PasswordModule,
    DialogModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    ToastModule,
    InputTextModule
  ],
  providers: [MessageService, LogsService],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private logsService = inject(LogsService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  isAdmin: boolean = false;
  isLoadingTable: boolean = false;
  displayDialog: boolean = false;
  displayLogsDialog: boolean = false;
  allLogs: any[] = [];

  roleOptions = [
    { label: 'Administrator', value: 'admin' },
    { label: 'User', value: 'user' }
  ];

  displayPasswordDialog: boolean = false;
  isLoading: boolean = false;

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.checkAccess();
    this.loadUsers();
  }

  private checkAccess() {
    const userRole = localStorage.getItem('role');
    this.isAdmin = userRole === 'admin';
  }

  async loadUsers() {
    if (!this.isAdmin) return;

    this.isLoadingTable = true;
    try {
      const data = await this.authService.getAllEmployees();
      console.log(data)
      if (Array.isArray(data)) {
        this.users = data;
      } else {
        this.users = [data];
      }
    } catch (error: any) {
      this.showError('Failed to load user list.');
    } finally {
      this.isLoadingTable = false;
    }
  }

  async onDeleteUser(user: any) {
    const confirmation = confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`);

    if (confirmation) {
      try {
        await this.authService.deleteUser(user.id);
        this.showSuccess('User deleted successfully.');

        this.users = this.users.filter(u => u.id !== user.id);
        this.cdr.detectChanges();
      } catch (error: any) {
        this.showError(error.message || 'Error deleting user.');
      }
    }
  }

  async onRoleChange(user: any) {
    try {
      await this.authService.setRole(user.id, user.role);
      this.showSuccess(`Role for ${user.email} updated to ${user.role}.`);
    } catch (error: any) {
      this.showError(error.message || 'Error while updating user role.');
      this.loadUsers();
    }
  }

  showDialog() {
    this.displayPasswordDialog = true;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  async onUpdatePassword() {
    if (!this.passwordData.currentPassword || !this.passwordData.newPassword) {
      this.showError('All fields are required.');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.showError('The new passwords do not match.');
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.updatePassword({
        currentPassword: this.passwordData.currentPassword,
        newPassword: this.passwordData.newPassword
      });

      this.showSuccess('Password updated successfully.');
      this.displayPasswordDialog = false;
    } catch (error: any) {
      this.showError(error.message || 'An error occurred while updating the password.');
    } finally {
      this.isLoading = false;
    }
  }

  getRoleSeverity(role: string): 'danger' | 'info' | 'secondary' | 'warn' {
    switch (role?.toLowerCase()) {
      case 'admin': return 'danger';
      case 'user': return 'info';
      case 'guest': return 'secondary';
      default: return 'warn';
    }
  }

  private showSuccess(msg: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: msg
    });
  }

  private showError(msg: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg
    });
  }

  async loadLogs() {
    try {
      this.displayLogsDialog = true;
      await this.syncLogs();
      this.cdr.markForCheck();
    } catch (error) {
      console.error(error);
      this.showError('Failed to load logs');
    }
  }

  async syncLogs() {
    try {
      const from = '2025-01-01';
      const to = '2027-12-31';

      const syncResult = await this.logsService.syncLogs();
      const data = await this.logsService.getLogs(from, to);
      
      this.allLogs = data || [];
      this.cdr.markForCheck();
      this.showSuccess(`Logs loaded (${this.allLogs.length} logs)`);
    } catch (error) {
      console.error('Error syncing logs:', error);
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

  hideDialog() {
    this.displayDialog = false;
  }

  hideLogsDialog() {
    this.displayLogsDialog = false;
  }
}