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
  
  get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }
  
  private _initializedResolver: (value: void | PromiseLike<void>) => void = () => {};
  public initialized = new Promise<void>((resolve) => {
    this._initializedResolver = resolve;
  });

  constructor() {
    this.checkInitialSession();
  }

  private async checkInitialSession() {
    try {
      // 1. Prioritize Standard Supabase Session (Most Secure)
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        console.log('🔄 Restoring Supabase Auth Session...');
        await this.fetchProfile(session.user.id, session.user.email!);
        return;
      }

      // 2. Fallback to Persistent Custom Session (Member Registry)
      const savedUser = localStorage.getItem('sb_user_session');
      if (savedUser) {
        const cachedProfile = JSON.parse(savedUser);
        
        // Developer Bypass Recovery (Local Only)
        if (cachedProfile.id === 'dev-001') {
          if (environment.production === false) {
            console.log('🔄 Restoring Developer Session...');
            this.currentUserSubject.next(cachedProfile);
          } else {
            localStorage.removeItem('sb_user_session');
          }
          return;
        }

        // Member Registry Re-validation (Audit Secure)
        console.log('🔄 Re-validating Member Session...');
        const { data: member, error } = await this.supabase
          .from('members')
          .select('*')
          .eq('id', cachedProfile.id)
          .eq('status', 'Active')
          .single();

        if (member && !error) {
          const permissions = await this.fetchPermissionsForRole(member.role);
          this.currentUserSubject.next({
            id: member.id,
            email: member.email_id,
            role: member.role,
            fullName: member.name,
            permissions: permissions
          });
        } else {
          console.warn('Session invalid or user deactivated.');
          localStorage.removeItem('sb_user_session');
        }
      }
    } catch (err) {
      console.warn('Initial session check failed:', err);
    } finally {
      this._initializedResolver();
    }
  }

  async login(email: string, pass: string) {
    // Developer Bypass for Local Testing (Disabled in Production for Security)
    if (environment.production === false && email === 'admin@gmail.com' && (pass === 'Admin@123' || pass === 'admin')) {
      console.log('🛡️ Developer Bypass Activated (Local Mode)');
      const profile: UserProfile = {
        id: 'dev-001',
        email: email,
        role: 'Sabha Sanchalak',
        fullName: 'System Developer',
        permissions: this.getAdminPermissions()
      };
      this.currentUserSubject.next(profile);
      localStorage.setItem('sb_user_session', JSON.stringify(profile));
      this._initializedResolver();
      return { session: { user: { id: 'dev-001' } } };
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (!error && data.session) {
      await this.fetchProfile(data.session.user.id, data.session.user.email!);
      return data;
    }

    // 3. Custom Member Registry Login
    console.log('🔍 Checking Member Registry for credentials...');
    const { data: member, error: memberError } = await this.supabase
      .from('members')
      .select('*')
      .eq('email_id', email)
      .eq('password', pass)
      .eq('status', 'Active')
      .single();

    if (memberError || !member) {
      throw new Error(error?.message || 'Invalid credentials or inactive account.');
    }

    console.log('✅ Member Login Successful:', member.name);
    const permissions = await this.fetchPermissionsForRole(member.role);
    
    const profile: UserProfile = {
      id: member.id,
      email: member.email_id,
      role: member.role,
      fullName: member.name,
      permissions: permissions
    };
    
    this.currentUserSubject.next(profile);
    localStorage.setItem('sb_user_session', JSON.stringify(profile)); // Persistence for member session
    this._initializedResolver();
    
    return { session: { user: { id: member.id } } };
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
        permissions: this.getPermissionsByRole('Volunteer')
      });
      return;
    }

    // Fetch Dynamic Role Permissions
    const permissions = await this.fetchPermissionsForRole(profileData.role || 'Volunteer');

    const profile: UserProfile = {
      id: uid,
      email: email,
      role: profileData.role || 'Volunteer',
      fullName: profileData.full_name || email.split('@')[0],
      permissions: permissions
    };
    this.currentUserSubject.next(profile);
  }

  public async fetchPermissionsForRole(roleName: string): Promise<PermissionMatrix> {
    // 1. Start with Hardcoded Fallback
    let permissions = this.getPermissionsByRole(roleName);

    try {
      // 2. Attempt to fetch from "roles" table in database
      const { data: roleData, error: roleError } = await this.supabase
        .from('roles')
        .select('permissions')
        .eq('name', roleName.trim())
        .single();
      
      if (!roleError && roleData?.permissions) {
        console.log(`🔐 Loaded dynamic permissions for role: ${roleName}`);
        permissions = roleData.permissions as PermissionMatrix;
      }
    } catch (err) {
      console.warn('DB permissions fetch failed, using hardcoded mapping:', err);
    }

    return permissions;
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
        members: { view: true, create: false, edit: false, delete: false },
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
    localStorage.removeItem('sb_user_session');
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
    const r = profile.role?.trim() || '';
    if (r === 'Admin' || r.includes('Admin') || r.includes('Sanchalak')) return true;
    
    if (!profile.permissions || !profile.permissions[module]) return false;
    return profile.permissions[module][action];
  }
}
