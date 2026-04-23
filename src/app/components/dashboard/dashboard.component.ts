import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js/auto';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header animate-fade-in" style="margin-bottom: 32px;">
      <div>
        <h1 style="font-weight: 800; color: var(--text-dark); letter-spacing: -0.04em; margin: 0;">नमस्ते, {{ (auth.currentUser$ | async)?.fullName || 'Admin' }}! 👋</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">Strategic Command • Sabha Intelligence Portal</p>
      </div>
      <div class="hide-on-mobile" style="display: flex; gap: 12px;">
         <button (click)="loadStats()" class="btn" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-dark);">🔄 Refresh Insights</button>
      </div>
    </div>

    <div class="bento-grid animate-slide-up">
      
      <!-- 1) TOTAL MEMBER VIEW AND COUNT -->
      <div class="bento-item col-4">
         <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div class="form-label">Total Membership</div>
            <div style="font-size: 1.5rem;">👥</div>
         </div>
         <div *ngIf="!isLoading" style="font-size: 3rem; font-weight: 800; color: var(--text-dark); letter-spacing: -0.02em;">
            {{ report?.memberCount }}
         </div>
         <div *ngIf="isLoading" class="skeleton" style="height: 60px; width: 120px; border-radius: 12px;"></div>
         <div style="margin-top: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: 800; font-size: 0.85rem;">↑ 12% Growth</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">vs last quarter</span>
         </div>
      </div>

      <!-- 2) WEEKLY SABHA ATTENDANCE WISE GRAPH -->
      <div class="bento-item col-8 row-2">
         <div class="form-label" style="margin-bottom: 24px;">Weekly Attendance Trends</div>
         <div style="height: 250px; position: relative;">
            <canvas #attendanceChart></canvas>
         </div>
      </div>

      <!-- 3) PREVIOUS SABHA ATTENDANCE COUNT AND VIEW -->
      <div class="bento-item col-4">
         <div class="form-label" style="margin-bottom: 20px;">Last Sabha Highlights</div>
         <div *ngIf="lastSabha" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="padding: 16px; background: var(--bg-main); border-radius: 12px; border: 1px solid var(--border-color);">
               <div style="font-weight: 800; color: var(--text-dark); font-size: 1rem; margin-bottom: 4px;">{{ lastSabha.title }}</div>
               <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">{{ lastSabha.date | date:'mediumDate' }}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
               <div style="text-align: center;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--success);">{{ lastSabha.present }}</div>
                  <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Present</div>
               </div>
               <div style="text-align: center;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--danger);">{{ lastSabha.absent }}</div>
                  <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Absent</div>
               </div>
               <div style="text-align: center;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--warning);">{{ lastSabha.leave }}</div>
                  <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Leave</div>
               </div>
            </div>
         </div>
         <div *ngIf="isLoading" class="skeleton" style="height: 120px; width: 100%; border-radius: 12px;"></div>
      </div>

      <!-- 4) FINANCE MODULE VIEW WITH GRAPH -->
      <div class="bento-item col-8 row-2">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="form-label">Financial Growth history</div>
            <div style="font-weight: 800; color: var(--text-dark);">₹{{ report?.totalBalance | number }}</div>
         </div>
         <div style="height: 250px; position: relative;">
            <canvas #financeChart></canvas>
         </div>
      </div>

      <!-- Quick Action Hub -->
      <div class="bento-item col-4 row-2">
         <div class="form-label" style="margin-bottom: 24px;">Operation Center</div>
         <div style="display: grid; gap: 12px;">
            <button (click)="router.navigate(['/attendance'])" class="action-btn">
               <span class="icon">📝</span>
               <div class="text">
                  <div class="title">Mark Attendance</div>
                  <div class="sub">Track live presence</div>
               </div>
            </button>
            <button (click)="router.navigate(['/members'])" class="action-btn">
               <span class="icon">👤</span>
               <div class="text">
                  <div class="title">New Registration</div>
                  <div class="sub">Add member profile</div>
               </div>
            </button>
            <button (click)="router.navigate(['/wallet'])" class="action-btn">
               <span class="icon">💰</span>
               <div class="text">
                  <div class="title">Financial Audit</div>
                  <div class="sub">Review transactions</div>
               </div>
            </button>
         </div>
      </div>

    </div>

    <!-- Mobile refresh FAB -->
    <button class="fab show-on-mobile animate-fade-in" (click)="loadStats()" aria-label="Refresh Dashboard">
      <span style="font-size: 1.2rem;">🔄</span>
    </button>
  `,
  styles: [`
    .action-btn {
       display: flex;
       align-items: center;
       gap: 16px;
       padding: 16px;
       background: var(--bg-main);
       border: 1px solid var(--border-color);
       border-radius: 16px;
       cursor: pointer;
       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
       text-align: left;
       width: 100%;
    }
    .action-btn:hover {
       background: var(--bg-card);
       border-color: var(--primary);
       transform: translateY(-2px);
       box-shadow: var(--shadow-md);
    }
    .action-btn .icon {
       font-size: 1.5rem;
       width: 48px;
       height: 48px;
       background: var(--bg-card);
       border-radius: 12px;
       display: flex;
       align-items: center;
       justify-content: center;
       border: 1px solid var(--border-color);
    }
    .action-btn .title { font-weight: 800; color: var(--text-dark); font-size: 0.9rem; }
    .action-btn .sub { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);
  
  report: any = null;
  lastSabha: any = null;
  isLoading = false;

  @ViewChild('attendanceChart') attendanceCanvas!: ElementRef;
  @ViewChild('financeChart') financeCanvas!: ElementRef;
  
  private attChart: any;
  private finChart: any;

  async ngOnInit() {
    await this.loadStats();
  }

  ngAfterViewInit() {
    // Initial empty charts or wait for data
  }

  async loadStats() {
    this.isLoading = true;
    try {
      const [stats, lastSabha, attTrends, finTrends] = await Promise.all([
        this.supabase.getOrganizationStats(),
        this.supabase.getLastSabhaStats(),
        this.supabase.getWeeklyAttendanceTrends(),
        this.supabase.getFinancialTrends()
      ]);
      
      this.report = stats;
      this.lastSabha = lastSabha;
      
      this.renderCharts(attTrends, finTrends);
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      this.isLoading = false;
    }
  }

  renderCharts(attData: any[], finData: any[]) {
    if (this.attChart) this.attChart.destroy();
    if (this.finChart) this.finChart.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#FDFCFC' : '#2F3035';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Attendance Trend Chart
    this.attChart = new Chart(this.attendanceCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: attData.map(d => new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
        datasets: [{
          label: 'Present Count',
          data: attData.map(d => d.count),
          borderColor: '#F87941',
          backgroundColor: 'rgba(248, 121, 65, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#F87941'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: gridColor },
            ticks: { color: textColor, font: { weight: '600' } }
          },
          x: { 
            grid: { display: false },
            ticks: { color: textColor, font: { weight: '600' } }
          }
        }
      }
    });

    // Financial Trend Chart
    this.finChart = new Chart(this.financeCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: finData.map(d => d.month),
        datasets: [{
          label: 'Total Balance',
          data: finData.map(d => d.balance),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            grid: { color: gridColor },
            ticks: { 
              color: textColor, 
              font: { weight: '600' },
              callback: (value) => '₹' + (Number(value) / 1000) + 'k'
            }
          },
          x: { 
            grid: { display: false },
            ticks: { color: textColor, font: { weight: '600' } }
          }
        }
      }
    });
  }
}
