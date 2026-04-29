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
    <div class="page-header animate-fade-in" style="margin-bottom: 32px; flex-direction: column; align-items: flex-start; gap: 16px;">
      <div>
        <h1 style="font-weight: 800; color: var(--text-dark); letter-spacing: -0.04em; margin: 0; font-size: 1.8rem;">नमस्ते, {{ (auth.currentUser$ | async)?.fullName || 'Admin' }}! 👋</h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px; font-weight: 500;">Strategic Command Center • Sabha Intelligence Portal</p>
      </div>
      <div class="show-on-mobile" style="width: 100%;">
         <button (click)="loadStats()" class="btn" style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-dark); justify-content: center; font-weight: 700;">🔄 Refresh Insights</button>
      </div>
    </div>

    <div class="bento-grid animate-slide-up">
      
      <!-- STATS ROW -->
      <div class="bento-item col-4 stat-card">
         <div class="stat-header">
            <span class="stat-title">Total Membership</span>
            <span class="stat-icon mem-icon">👥</span>
         </div>
         <div *ngIf="!isLoading" class="stat-value">{{ report?.memberCount }}</div>
         <div *ngIf="isLoading" class="skeleton stat-skeleton"></div>
         <div class="stat-footer success">↑ Active Community</div>
      </div>

      <div class="bento-item col-4 stat-card">
         <div class="stat-header">
            <span class="stat-title">Financial Balance</span>
            <span class="stat-icon wal-icon">💰</span>
         </div>
         <div *ngIf="!isLoading" class="stat-value">₹{{ report?.totalBalance | number }}</div>
         <div *ngIf="isLoading" class="skeleton stat-skeleton"></div>
         <div class="stat-footer success">↑ Core Fund</div>
      </div>

      <div class="bento-item col-4 stat-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
         <div style="padding: 24px 24px 0 24px;">
            <div class="stat-header">
               <span class="stat-title">Last Sabha: {{ lastSabha?.title || 'Loading...' }}</span>
               <span class="stat-icon att-icon">📊</span>
            </div>
         </div>
         <div *ngIf="lastSabha" style="display: flex; flex: 1; margin-top: 16px;">
            <div class="attendance-stat present">
               <div class="val">{{ lastSabha.present }}</div>
               <div class="lbl">Present</div>
            </div>
            <div class="attendance-stat absent">
               <div class="val">{{ lastSabha.absent }}</div>
               <div class="lbl">Absent</div>
            </div>
            <div class="attendance-stat leave">
               <div class="val">{{ lastSabha.leave }}</div>
               <div class="lbl">Leave</div>
            </div>
         </div>
         <div *ngIf="isLoading" class="skeleton" style="height: 100%; margin: 16px 24px 24px;"></div>
      </div>

      <!-- MODULE NAVIGATION HUB -->
      <div style="grid-column: span 12; margin-top: 12px;">
         <div class="form-label" style="margin-bottom: 20px; font-size: 1.2rem; color: var(--text-dark);">🚀 Operations Command Center</div>
         <div class="module-grid">
            <button (click)="router.navigate(['/members'])" class="module-card">
               <div class="module-icon mem-icon">👥</div>
               <div class="module-info">
                  <div class="title">Member Registry</div>
                  <div class="sub">Manage profiles & details</div>
               </div>
               <div class="go-arrow">→</div>
            </button>
            <button (click)="router.navigate(['/attendance'])" class="module-card">
               <div class="module-icon att-icon">📝</div>
               <div class="module-info">
                  <div class="title">Attendance Tracker</div>
                  <div class="sub">Record live presence</div>
               </div>
               <div class="go-arrow">→</div>
            </button>
            <button (click)="router.navigate(['/schedule'])" class="module-card">
               <div class="module-icon sch-icon">📅</div>
               <div class="module-info">
                  <div class="title">Sabha Scheduler</div>
                  <div class="sub">Plan upcoming events</div>
               </div>
               <div class="go-arrow">→</div>
            </button>
            <button (click)="router.navigate(['/wallet'])" class="module-card">
               <div class="module-icon wal-icon">💰</div>
               <div class="module-info">
                  <div class="title">Wallet & Financials</div>
                  <div class="sub">Manage organization funds</div>
               </div>
               <div class="go-arrow">→</div>
            </button>
            <button (click)="router.navigate(['/reports'])" class="module-card">
               <div class="module-icon rep-icon">📊</div>
               <div class="module-info">
                  <div class="title">System Reports</div>
                  <div class="sub">Generate analytical audits</div>
               </div>
               <div class="go-arrow">→</div>
            </button>
            <button (click)="router.navigate(['/roles'])" class="module-card">
               <div class="module-icon rol-icon">🛡️</div>
               <div class="module-info">
                  <div class="title">Security & Roles</div>
                  <div class="sub">Access control matrix</div>
               </div>
               <div class="go-arrow">→</div>
            </button>
         </div>
      </div>

      <!-- CHARTS -->
      <div class="bento-item col-6 row-2" style="margin-top: 12px;">
         <div class="form-label" style="margin-bottom: 24px; font-size: 1.1rem;">📈 Weekly Attendance Trends</div>
         <div style="height: 280px; position: relative;">
            <canvas #attendanceChart></canvas>
         </div>
      </div>

      <div class="bento-item col-6 row-2" style="margin-top: 12px;">
         <div class="form-label" style="margin-bottom: 24px; font-size: 1.1rem;">💵 Financial Growth History</div>
         <div style="height: 280px; position: relative;">
            <canvas #financeChart></canvas>
         </div>
      </div>

    </div>

    <!-- Mobile refresh FAB -->
    <button class="fab show-on-mobile animate-fade-in" (click)="loadStats()" 
            style="bottom: 100px; right: 24px; z-index: 100;"
            aria-label="Refresh Dashboard">
      <span style="font-size: 1.2rem;">🔄</span>
    </button>
  `,
  styles: [`
    .stat-card {
       display: flex;
       flex-direction: column;
       justify-content: space-between;
    }
    .stat-header {
       display: flex;
       justify-content: space-between;
       align-items: flex-start;
       margin-bottom: 12px;
    }
    .stat-title {
       font-size: 0.9rem;
       font-weight: 800;
       color: var(--text-muted);
       text-transform: uppercase;
       letter-spacing: 0.05em;
    }
    .stat-icon {
       width: 40px;
       height: 40px;
       border-radius: 12px;
       display: flex;
       align-items: center;
       justify-content: center;
       font-size: 1.2rem;
    }
    .stat-value {
       font-size: 3rem;
       font-weight: 900;
       color: var(--text-dark);
       letter-spacing: -0.03em;
       line-height: 1;
    }
    .stat-skeleton {
       height: 48px;
       width: 60%;
       border-radius: 8px;
    }
    .stat-footer {
       margin-top: 16px;
       font-size: 0.8rem;
       font-weight: 700;
    }
    .stat-footer.success { color: var(--success); }

    .attendance-stat {
       flex: 1;
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
       padding: 16px;
       background: var(--bg-main);
       border-top: 1px solid var(--border-color);
    }
    .attendance-stat:not(:last-child) {
       border-right: 1px solid var(--border-color);
    }
    .attendance-stat .val { font-size: 1.5rem; font-weight: 900; margin-bottom: 4px; }
    .attendance-stat .lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    .attendance-stat.present .val { color: var(--success); }
    .attendance-stat.absent .val { color: var(--danger); }
    .attendance-stat.leave .val { color: var(--warning); }

    .module-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
       gap: 20px;
    }
    .module-card {
       background: var(--bg-card);
       border: 1px solid var(--border-color);
       border-radius: 20px;
       padding: 20px;
       display: flex;
       align-items: center;
       gap: 16px;
       cursor: pointer;
       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
       text-align: left;
       position: relative;
       overflow: hidden;
    }
    .module-card:hover {
       transform: translateY(-4px);
       box-shadow: 0 12px 24px rgba(0,0,0,0.06);
       border-color: var(--primary);
    }
    .dark-theme .module-card:hover {
       box-shadow: 0 12px 24px rgba(0,0,0,0.3);
    }
    .module-card::after {
       content: '';
       position: absolute;
       top: 0; left: 0; right: 0; bottom: 0;
       background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
       opacity: 0;
       transition: opacity 0.3s;
    }
    .module-card:hover::after { opacity: 1; }
    
    .module-icon {
       width: 56px;
       height: 56px;
       border-radius: 16px;
       display: flex;
       align-items: center;
       justify-content: center;
       font-size: 1.8rem;
       flex-shrink: 0;
    }
    .mem-icon { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
    .att-icon { background: rgba(16, 185, 129, 0.1); color: #10B981; }
    .sch-icon { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
    .wal-icon { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
    .rep-icon { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
    .rol-icon { background: rgba(107, 114, 128, 0.1); color: #6B7280; }

    .module-info { flex: 1; }
    .module-info .title { font-weight: 800; font-size: 1.1rem; color: var(--text-dark); margin-bottom: 4px; }
    .module-info .sub { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
    
    .go-arrow {
       font-size: 1.2rem;
       color: var(--text-muted);
       opacity: 0.5;
       transition: all 0.3s;
       transform: translateX(-10px);
    }
    .module-card:hover .go-arrow {
       opacity: 1;
       transform: translateX(0);
       color: var(--primary);
    }
    
    @media (max-width: 768px) {
       .module-grid {
          grid-template-columns: 1fr;
          gap: 12px;
       }
       .module-card {
          padding: 16px;
          border-radius: 16px;
       }
       .module-icon {
          width: 48px;
          height: 48px;
          font-size: 1.5rem;
       }
       .module-info .title { font-size: 1rem; }
       .module-info .sub { font-size: 0.75rem; }
       .stat-value { font-size: 2.2rem; }
    }
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
            ticks: { color: textColor, font: { weight: 600 } }
          },
          x: { 
            grid: { display: false },
            ticks: { color: textColor, font: { weight: 600 } }
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
              font: { weight: 600 },
              callback: (value) => '₹' + (Number(value) / 1000) + 'k'
            }
          },
          x: { 
            grid: { display: false },
            ticks: { color: textColor, font: { weight: 600 } }
          }
        }
      }
    });
  }
}
