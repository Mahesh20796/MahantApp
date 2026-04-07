import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SabhaManagementComponent } from './components/sabha-management/sabha-management.component';
import { MemberManagementComponent } from './components/member-management/member-management.component';
import { AttendanceManagementComponent } from './components/attendance-management/attendance-management.component';
import { WalletManagementComponent } from './components/wallet-management/wallet-management.component';
import { ReportsComponent } from './components/reports/reports.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'sabhas', component: SabhaManagementComponent, canActivate: [authGuard] },
  { path: 'members', component: MemberManagementComponent, canActivate: [authGuard] },
  { path: 'attendance', component: AttendanceManagementComponent, canActivate: [authGuard] },
  { path: 'wallet', component: WalletManagementComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'roles', component: RoleManagementComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
