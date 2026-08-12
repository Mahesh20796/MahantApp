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
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { module: 'dashboard' } },
  { path: 'sabhas', component: SabhaManagementComponent, canActivate: [authGuard], data: { module: 'sabha_history' } },
  { path: 'members', component: MemberManagementComponent, canActivate: [authGuard], data: { module: 'members' } },
  { path: 'attendance', component: AttendanceManagementComponent, canActivate: [authGuard], data: { module: 'attendance' } },
  { path: 'wallet', component: WalletManagementComponent, canActivate: [authGuard], data: { module: 'financials' } },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard], data: { module: 'reports' } },
  { path: 'roles', component: RoleManagementComponent, canActivate: [authGuard], data: { module: 'roles' } },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
