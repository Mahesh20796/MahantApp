import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) {
    const requiredRole = route.data['role'];
    if (requiredRole && auth.userRole !== requiredRole && auth.userRole !== 'Admin') {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
