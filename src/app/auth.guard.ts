import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialized;

  if (auth.isLoggedIn) {
    const module = route.data['module'];
    if (module && !auth.hasPermission(module, 'view')) {
      console.warn(`Unauthorized access attempt to module: ${module}`);
      
      // Find first available module
      const navLinks = [
        { module: 'dashboard', path: '/dashboard' },
        { module: 'sabha_history', path: '/sabhas' },
        { module: 'members', path: '/members' },
        { module: 'attendance', path: '/attendance' },
        { module: 'financials', path: '/wallet' },
        { module: 'reports', path: '/reports' }
      ];
      
      const firstAvailable = navLinks.find(link => auth.hasPermission(link.module, 'view'));
      if (firstAvailable) {
        router.navigate([firstAvailable.path]);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
