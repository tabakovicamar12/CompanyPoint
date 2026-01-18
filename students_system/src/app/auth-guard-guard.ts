import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth-service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const userRole = localStorage.getItem('role')?.toLowerCase();
  const token = localStorage.getItem('token');
  
  if (!userRole || !token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const availableRoles = await authService.getRoles();
    const normalizedRoles = availableRoles.map(r => r.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      router.navigate(['/login']);
      return false;
    }
  } catch (error) {
    console.error("Error validating roles:", error);
    router.navigate(['/login']);
    return false;
  }

  const allowedForRoute = route.data?.['roles'] as Array<string>;

  if (!allowedForRoute) {
    return true; 
  }

  if (allowedForRoute.map(r => r.toLowerCase()).includes(userRole)) {
    return true;
  }

  router.navigate(['/todo']);
  return false;
};