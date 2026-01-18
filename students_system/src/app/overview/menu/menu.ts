import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { Button } from 'primeng/button';
import { AuthService } from '../../../auth-service';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { OnInit, OnDestroy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MenubarModule, AvatarModule, BadgeModule, Button, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Menu implements OnInit, OnDestroy {
  userEmail: string = '';
  userRole: string = '';
  items: MenuItem[] = [];

  constructor(private authService: AuthService, private router: Router) { }

  private cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;

  ngOnInit() {
    this.initializeFromStorage();
    this.generateMenu();

    this.subscription = this.authService.user$.subscribe(user => {
      this.cdr.markForCheck();

      if (user) {
        this.userEmail = user.email;
        this.userRole = user.role;
        this.generateMenu();
      } else {
        this.userEmail = '';
        this.userRole = '';
        this.items = [];
        this.cdr.markForCheck();
      }
    });

    const storageListener = () => {
      this.initializeFromStorage();
      this.generateMenu();
      this.cdr.markForCheck();
    };

    const loginListener = () => {
      this.initializeFromStorage();
      this.generateMenu();
      this.cdr.markForCheck();
    };

    window.addEventListener('storage', storageListener);
    window.addEventListener('userLoggedIn', loginListener);

    const originalNgOnDestroy = this.ngOnDestroy.bind(this);
    this.ngOnDestroy = () => {
      window.removeEventListener('storage', storageListener);
      window.removeEventListener('userLoggedIn', loginListener);
      originalNgOnDestroy();
    };
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initializeFromStorage() {
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (email && role) {
      this.userEmail = email;
      this.userRole = role;
    } else {
      this.userEmail = '';
      this.userRole = '';
    }
  }

  generateMenu() {
    const role = (this.userRole || '').toLowerCase();

    const baseItems: MenuItem[] = [
      { label: 'Tasks', icon: 'pi pi-check-square', command: () => this.router.navigate(['/todo']) },
      { label: 'Work Hours', icon: 'pi pi-clock', command: () => this.router.navigate(['/workhours']) },
      { label: 'Expenses', icon: 'pi pi-wallet', command: () => this.router.navigate(['/expenses']) },
      { label: 'Holidays', icon: 'pi pi-sun', command: () => this.router.navigate(['/holidays']) },
      { label: 'Reports', icon: 'pi pi-chart-bar', command: () => this.router.navigate(['/reporting']) },
      { label: 'Profile', icon: 'pi pi-lock', command: () => this.router.navigate(['/profile']) },
    ];

    if (role === 'admin') {
      this.items = [
        ...baseItems,
        { label: 'Employees', icon: 'pi pi-users', command: () => this.router.navigate(['/employee']) },
        { label: 'Statistics', icon: 'pi pi-chart-line', command: () => this.router.navigate(['/statistics']) }
      ];
    } else {
      this.items = baseItems;
    }

    this.cdr.markForCheck();
  }

  logout() {
    this.authService.logout();
  }
}