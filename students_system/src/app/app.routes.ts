import { Routes } from '@angular/router';
import { authGuard } from './auth-guard-guard';
import { MainLayoutComponent } from './main/main';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./overview/login/login').then(m => m.LoginComponent),
    },
    {
        path: 'register',
        loadComponent: () => import('./overview/register/register').then(m => m.RegisterComponent),
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'overview',
                loadComponent: () => import('./overview/overview/overview.component').then(m => m.OverviewComponent),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: 'employee',
                loadComponent: () => import('./overview/employee/employee').then(m => m.EmployeeComponent),
                data: { roles: ['admin'] }
            },
            {
                path: 'statistics',
                loadComponent: () => import('./overview/statistic-component/statistic-component').then(m => m.StatisticComponent),
                data: { roles: ['admin'] }
            },
            {
                path: 'profile',
                loadComponent: () => import('./overview/profile/profile').then(m => m.Profile),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: 'todo',
                loadComponent: () => import('./overview/todo/todo').then(m => m.Todo),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: 'workhours',
                loadComponent: () => import('./overview/workhours/workhours').then(m => m.Workhours),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: 'expenses',
                loadComponent: () => import('./overview/expenses/expenses').then(m => m.Expenses),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: 'holidays',
                loadComponent: () => import('./overview/holidays/holidays').then(m => m.Holidays),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: 'reporting',
                loadComponent: () => import('./overview/reporting/reporting').then(m => m.Reporting),
                data: { roles: ['user', 'admin'] }
            },
            {
                path: '',
                redirectTo: 'todo',
                pathMatch: 'full'
            }
        ]
    },

    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];