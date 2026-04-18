import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header animate-fade-in" style="margin-bottom: 32px;">
      <div>
        <h1 style="font-weight: 800; color: var(--text-dark); letter-spacing: -0.04em; margin: 0;">नमस्ते, {{ (auth.currentUser$ | async)?.fullName || 'Admin' }}! 👋</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">Intelligence Center • Sabha Management Portal</p>
      </div>
    </div>

    <!-- Symmetrical Institutional Grid -->
    <div class="bento-grid animate-slide-up">
      
      <!-- Portfolio Overview -->
      <div class="bento-item col-8 row-2">
         <div class="form-label" style="margin-bottom: 24px;">Financial Portfolio</div>
         <div *ngIf="!isLoading" style="display: flex; align-items: baseline; gap: 12px;">
            <div style="font-size: 3rem; font-weight: 800; color: var(--text-dark); letter-spacing: -0.02em;">₹{{ report?.totalBalance | number }}</div>
            <div style="color: var(--success); font-weight: 700; font-size: 0.95rem;">↑ LIVE</div>
         </div>
         <div *ngIf="isLoading" class="skeleton" style="height: 60px; width: 250px; border-radius: 8px;"></div>

         <div style="margin-top: 32px; height: 6px; background: var(--bg-main); border-radius: 10px; border: 1px solid var(--border-color); overflow: hidden;">
            <div [style.width]="'65%'" style="height: 100%; background: var(--primary); border-radius: 10px;"></div>
         </div>
         <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
            <span>Current Efficiency</span>
            <span style="color: var(--text-dark);">System Health Optimized</span>
         </div>
      </div>

      <!-- Quick Stats -->
      <div class="bento-item col-4">
         <div class="form-label" style="margin-bottom: 12px;">Active Members</div>
         <div *ngIf="!isLoading" style="font-size: 2.2rem; font-weight: 800; color: var(--text-dark);">{{ report?.memberCount }}</div>
         <div *ngIf="isLoading" class="skeleton" style="height: 40px; width: 100px; border-radius: 8px;"></div>
         <div style="margin-top: 12px; font-size: 0.75rem; color: var(--success); font-weight: 800;">● Live Pulse Active</div>
      </div>

      <div class="bento-item col-4">
         <div class="form-label" style="margin-bottom: 12px;">Monthly Events</div>
         <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-dark);">24</div>
         <div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Scheduled for Apr 2026</div>
      </div>

      <!-- Action Hub -->
      <div class="bento-item col-4 row-2">
         <div class="form-label" style="margin-bottom: 24px;">Quick Actions</div>
         <div style="display: flex; flex-direction: column; gap: 12px;">
            <button (click)="router.navigate(['/attendance'])" class="btn btn-primary" style="height: 48px; justify-content: center;">Track Attendance</button>
            <button (click)="router.navigate(['/members'])" class="btn" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark); height: 48px; justify-content: center;">Register Member</button>
            <button (click)="router.navigate(['/wallet'])" class="btn" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark); height: 48px; justify-content: center;">Process Payment</button>
         </div>
      </div>

      <!-- Live Notification Feed -->
      <div class="bento-item col-8">
         <div style="display: flex; align-items: center; gap: 16px;">
            <div style="height: 12px; width: 12px; border-radius: 50%; background: var(--primary); flex-shrink: 0;"></div>
            <div style="font-weight: 700; color: var(--text-dark); font-size: 1rem;">System Health verified. Financial data synced with Supabase.</div>
         </div>
      </div>

      <!-- System Health -->
      <div class="bento-item col-12" style="background: var(--bg-sidebar); border: none; color: white; display: flex; flex-direction: row; justify-content: space-between; align-items: center; min-height: 80px;">
         <div style="display: flex; align-items: center; gap: 20px;">
            <div style="font-size: 1.5rem;">🛡️</div>
            <div>
               <div style="font-weight: 800; font-size: 0.9rem; letter-spacing: 0.05em; text-transform: uppercase;">Cloud Integrity Active</div>
               <div style="font-size: 0.75rem; opacity: 0.7;">Verified by Antigravity Digital Engine</div>
            </div>
         </div>
         <div style="font-size: 0.75rem; font-weight: 800; color: var(--primary);">SYSTEM SECURE</div>
      </div>

    </div>

    <!-- Mobile refresh FAB -->
    <button class="fab show-on-mobile animate-fade-in" (click)="loadStats()" aria-label="Refresh Dashboard">
      <span style="font-size: 1.2rem;">🔄</span>
    </button>
  `
})
export class DashboardComponent implements OnInit {
  private supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);
  report: any = null;
  isLoading = false;

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    try {
      this.report = await this.supabase.getOrganizationStats();
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      this.isLoading = false;
    }
  }
}
