import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable, from, map } from 'rxjs';
import { Router } from '@angular/router';

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
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.checkInitialSession();
  }

  private async checkInitialSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      this.fetchProfile(session.user.id, session.user.email!);
    }
  }

  async login(email: string, pass: string) {
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
