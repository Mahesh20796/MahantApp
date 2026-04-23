import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable, from, map, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PermissionMatrix } from '../models/role.model';

export type UserRole = 'Admin' | 'Executive' | 'Volunteer' | 'User';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  fullName: string;
  permissions?: PermissionMatrix;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private _initializedResolver: (value: void | PromiseLike<void>) => void = () => {};
  public initialized = new Promise<void>((resolve) => {
    this._initializedResolver = resolve;
  });

  constructor() {
    this.checkInitialSession();
  }

  private async checkInitialSession() {
    try {
      // 1. Check for Developer Bypass Persistence
      const devUser = localStorage.getItem('sb_dev_user');
      if (devUser && environment.production === false) {
          console.log('🔄 Restoring Persistent Developer Session...');
          this.currentUserSubject.next(JSON.parse(devUser));
          this._initializedResolver();
          return;
      }

      // 2. Standard Supabase Session Rehydration
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        await this.fetchProfile(session.user.id, session.user.email!);
      }
    } catch (err) {
      console.warn('Initial session check failed:', err);
    } finally {
      this._initializedResolver();
    }
  }

  async login(email: string, pass: string) {
    // Developer Bypass for Local Testing
    if (email === 'admin@gmail.com' && (pass === 'Admin@123' || pass === 'admin')) {
      console.log('🛡️ Developer Bypass Activated (Local Mode)');
      const profile: UserProfile = {
        id: 'dev-001',
        email: email,
        role: 'Sabha Sanchalak',
        fullName: 'System Developer',
        permissions: this.getAdminPermissions()
      };
      this.currentUserSubject.next(profile);
      localStorage.setItem('sb_dev_user', JSON.stringify(profile));
      this._initializedResolver();
      return { session: { user: { id: 'dev-001' } } };
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) throw error;
    if (data.session) {
      await this.fetchProfile(data.session.user.id, data.session.user.email!);
    }
    return data;
  }

  private async fetchProfile(uid: string, email: string) {
    console.log('Fetching profile for:', email);
    const { data: profileData, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (profileError) {
      console.warn('Profile not found:', profileError);
      this.currentUserSubject.next({
        id: uid,
        email: email,
        role: 'Volunteer',
        fullName: email.split('@')[0],
        permissions: this.getVolunteerPermissions()
      });
      return;
    }

    // Fetch Role Permissions
    let permissions: PermissionMatrix = this.getPermissionsByRole(profileData.role || 'Volunteer');

    try {
      // Attempt to fetch from DB if column exists, but handle missing column gracefully
      const { data: roleData, error: roleError } = await this.supabase
        .from('roles')
        .select('permissions')
        .eq('name', profileData.role)
        .single();
      
      if (!roleError && roleData?.permissions) {
        permissions = roleData.permissions as PermissionMatrix;
      }
    } catch (err) {
      console.warn('DB permissions fetch failed, using fallback mapping:', err);
    }

    const profile: UserProfile = {
      id: uid,
      email: email,
      role: profileData.role || 'Volunteer',
      fullName: profileData.full_name || email.split('@')[0],
      permissions: permissions
    };
    this.currentUserSubject.next(profile);
  }

  public getPermissionsByRole(roleName: string): PermissionMatrix {
    roleName = roleName.trim();
    
    // Super Admin / Sanchalak mapping
    if (roleName.includes('Admin') || roleName.includes('Sanchalak')) {
      return this.getAdminPermissions();
    }

    // Sampark Karyakar / Executive mapping
    if (roleName.includes('Sampark') || roleName.includes('Executive')) {
      return {
        dashboard: { view: false, create: false, edit: false, delete: false },
        members: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: true, edit: true, delete: true },
        sabha_history: { view: true, create: true, edit: true, delete: true },
        financials: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false }
      };
    }

    // Default Volunteer mapping
    return this.getVolunteerPermissions();
  }

  private getAdminPermissions(): PermissionMatrix {
    const modules = ['dashboard', 'sabha_history', 'members', 'roles', 'attendance', 'financials', 'reports'];
    const perms: PermissionMatrix = {};
    modules.forEach(m => {
      perms[m] = { view: true, create: true, edit: true, delete: true };
    });
    return perms;
  }

  private getVolunteerPermissions(): PermissionMatrix {
    return {
      attendance: { view: true, create: true, edit: false, delete: false }
    };
  }

  async logout() {
    localStorage.removeItem('sb_dev_user');
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get userRole(): string {
    return this.currentUserSubject.value?.role || 'User';
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  hasPermission(module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    const profile = this.currentUserSubject.value;
    if (!profile) return false;
    
    // Super Admin check
    if (profile.role === 'Admin' || profile.role === 'Sabha Sanchalak') return true;
    
    if (!profile.permissions || !profile.permissions[module]) return false;
    return profile.permissions[module][action];
  }
}
