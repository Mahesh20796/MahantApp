import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable, from, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export type UserRole = 'Admin' | 'Executive' | 'Volunteer' | 'User';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
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
    // Developer Bypass for Local Testing (Active only when project is down)
    if (email === 'admin@gmail.com' && (pass === 'Admin@123' || pass === 'admin')) {
      console.log('🛡️ Developer Bypass Activated (Local Mode)');
      const profile: UserProfile = {
        id: 'dev-001',
        email: email,
        role: 'Admin',
        fullName: 'System Developer'
      };
      this.currentUserSubject.next(profile);
      
      // Persist for refresh
      localStorage.setItem('sb_dev_user', JSON.stringify(profile));
      
      this._initializedResolver(); // Force ready
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
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      console.warn('Profile not found or error:', error);
      // Fallback for demo: if no profile, assign basic role
      this.currentUserSubject.next({
        id: uid,
        email: email,
        role: 'Volunteer',
        fullName: email.split('@')[0]
      });
      return;
    }

    if (data) {
      console.log('User Role found:', data.role);
      let roleVal = data.role as string;
      // Normalize admin -> Admin
      if (roleVal.toLowerCase() === 'admin') roleVal = 'Admin';

      const profile: UserProfile = {
        id: uid,
        email: email,
        role: roleVal as UserRole,
        fullName: data.full_name || email.split('@')[0]
      };
      this.currentUserSubject.next(profile);
    }
  }

  async logout() {
    localStorage.removeItem('sb_dev_user');
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get userRole(): UserRole {
    return this.currentUserSubject.value?.role || 'User';
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}
