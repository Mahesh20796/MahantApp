import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { FinancialReport } from '../../models/transaction.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showOnboarding" class="animate-fade-in" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); margin-bottom: 32px; border-radius: 24px; padding: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2);">
      <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="max-width: 600px;">
          <h2 style="color: white; font-weight: 800; font-size: 1.5rem; margin-bottom: 10px;">🌟 Master the Portal</h2>
          <p style="color: rgba(255,255,255,0.9); font-size: 0.95rem; line-height: 1.6; font-weight: 500;">
             Welcome to the modernized Sabha Connect! Use <b style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">Ctrl+K</b> for instant search, toggle <b>Dark Mode</b> in the sidebar, and use <b>Bulk Actions</b> in Member Management for faster updates.
          </p>
        </div>
        <button (click)="dismissOnboarding()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 12px; font-weight: 700; cursor: pointer;">✕ Dismiss</button>
      </div>
      <div style="position: absolute; right: -20px; bottom: -20px; font-size: 8rem; opacity: 0.1; transform: rotate(-15deg);">🌌</div>
    </div>

    <div class="dashboard-header animate-fade-in">
      <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">नमस्ते, {{ (auth.currentUser$ | async)?.fullName || 'Admin' }}! 👋</h1>
      <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500; margin-bottom: 32px;">Here is an overview of the current Sabha metrics and financial health.</p>
    </div>

    <!-- Stats Summary -->
    <div class="stats-grid animate-slide-up">
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.2);">💰</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Available Balance</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark);">₹{{ (report?.totalBalance || 0) | number }}</div>
        </div>
      </div>
      
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">📈</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Total Collections</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #10b981;">₹{{ (report?.totalIncome || 0) | number }}</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(225, 29, 72, 0.1); color: #e11d48; border: 1px solid rgba(225, 29, 72, 0.2);">📉</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Total Burn</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #e11d48;">₹{{ (report?.totalExpenses || 0) | number }}</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(202, 138, 4, 0.1); color: #ca8a04; border: 1px solid rgba(202, 138, 4, 0.2);">👥</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Active Members</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark);">1,248</div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 10px;" class="animate-slide-up">
      <!-- Quick Actions -->
      <div class="card">
        <h2 class="card-title">⚡ Command Center</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
          <button (click)="router.navigate(['/sabhas'])" class="btn" style="background: #f5f3ff; color: #5b21b6; flex-direction: column; height: 110px; border: 1px solid #ddd6fe; gap: 12px;">
             <span style="font-size: 1.5rem;">🗓️</span> Schedule Sabha
          </button>
          <button (click)="router.navigate(['/members'])" class="btn" style="background: #f0fdf4; color: #166534; flex-direction: column; height: 110px; border: 1px solid #bbf7d0; gap: 12px;">
             <span style="font-size: 1.5rem;">👤</span> Add Member
          </button>
          <button (click)="router.navigate(['/attendance'])" class="btn" style="background: #fff7ed; color: #9a3412; flex-direction: column; height: 110px; border: 1px solid #fed7aa; gap: 12px;">
             <span style="font-size: 1.5rem;">📝</span> Attendance
          </button>
        </div>
      </div>

      <!-- Recent Trends -->
      <div class="card">
        <h2 class="card-title">💡 Notifications</h2>
        <div style="padding: 16px; background: var(--bg-sidebar-hover); border-radius: 16px; border: 1px dashed var(--border-color); font-size: 0.95rem; color: var(--text-muted);">
          <div style="font-weight: 800; color: var(--primary); margin-bottom: 8px;">📢 Upcoming Event</div>
          Next <b>"Yuva Sabha"</b> is scheduled for this Sunday at <b>5:00 PM</b>. 
          <br><br>
          <a href="javascript:void(0)" style="color: var(--primary); font-weight: 700; text-decoration: none; border-bottom: 1px solid;">View Full Calendar →</a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  walletService = inject(WalletService);
  auth = inject(AuthService);
  router = inject(Router);
  report: FinancialReport | null = null;
  showOnboarding = true;

  ngOnInit() {
    this.showOnboarding = localStorage.getItem('onboarding_dismissed') !== 'true';
    this.loadStats();
  }

  loadStats() {
    this.report = {
      totalBalance: 125000,
      totalIncome: 150000,
      totalExpenses: 25000,
      transactions: []
    };
  }

  dismissOnboarding() {
    this.showOnboarding = false;
    localStorage.setItem('onboarding_dismissed', 'true');
  }
}
