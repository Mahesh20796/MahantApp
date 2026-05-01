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
    <div class="page-header animate-fade-in" style="margin-bottom: 24px;">
      <div>
        <h1 style="font-weight: 900; color: var(--text-dark); letter-spacing: -0.05em; margin: 0; font-size: 2.2rem; line-height: 1.1;">જય સ્વામિનારાયણ 🙏</h1>
        <p style="color: var(--text-muted); font-size: 1rem; margin-top: 8px; font-weight: 600; opacity: 0.8;">Sabha Intelligence Command Center</p>
      </div>
      <div class="hide-on-mobile">
         <button (click)="loadStats()" class="btn btn-primary" style="padding: 12px 24px; border-radius: 14px; box-shadow: var(--shadow-sm);">🔄 Refresh Portal</button>
      </div>
    </div>

    <!-- QUICK ACTIONS MOBILE SCROLL -->
    <div class="show-on-mobile animate-fade-in" style="margin-bottom: 24px;">
       <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; -webkit-overflow-scrolling: touch;">
          <button (click)="router.navigate(['/attendance'])" class="quick-action-pill att-icon">📝 Attendance</button>
          <button (click)="router.navigate(['/wallet'])" class="quick-action-pill wal-icon">💰 Wallet</button>
          <button (click)="router.navigate(['/members'])" class="quick-action-pill mem-icon">👥 Members</button>
       </div>
    </div>

    <div class="bento-grid animate-slide-up">
      
      <!-- CORE STATS -->
      <div class="bento-item col-4 stat-card-premium">
         <div class="stat-top">
            <div class="stat-icon-box mem-icon">👥</div>
            <span class="stat-label">Total Membership</span>
         </div>
         <div class="stat-main">
            <div *ngIf="!isLoading" class="stat-number">{{ report?.memberCount }}</div>
            <div *ngIf="isLoading" class="skeleton" style="height: 48px; width: 100px; border-radius: 12px;"></div>
            <div class="stat-trend success">Active Community</div>
         </div>
      </div>

      <div class="bento-item col-4 stat-card-premium">
         <div class="stat-top">
            <div class="stat-icon-box wal-icon">💰</div>
            <span class="stat-label">Core Balance</span>
         </div>
         <div class="stat-main">
            <div *ngIf="!isLoading" class="stat-number">₹{{ report?.totalBalance | number }}</div>
            <div *ngIf="isLoading" class="skeleton" style="height: 48px; width: 150px; border-radius: 12px;"></div>
            <div class="stat-trend success">Organization Fund</div>
         </div>
      </div>

      <div class="bento-item col-4 stat-card-premium last-sabha-special">
         <div class="stat-top">
            <div class="stat-icon-box att-icon">📊</div>
            <span class="stat-label">Last Sabha: {{ lastSabha?.title || 'Wait...' }}</span>
         </div>
         <div *ngIf="lastSabha" class="attendance-mini-grid">
            <div class="mini-att present">
               <span class="v">{{ lastSabha.present }}</span>
               <span class="l">Pres</span>
            </div>
            <div class="mini-att absent">
               <span class="v">{{ lastSabha.absent }}</span>
               <span class="l">Abs</span>
            </div>
            <div class="mini-att leave">
               <span class="v">{{ lastSabha.leave }}</span>
               <span class="l">Leav</span>
            </div>
         </div>
         <div *ngIf="isLoading" class="skeleton" style="height: 60px; width: 100%; border-radius: 12px; margin-top: 12px;"></div>
      </div>

      <!-- ANALYTICS PREVIEWS -->
      <div class="bento-item col-8 chart-item">
         <div class="chart-header">
            <h3 class="chart-title">📊 Attendance Trends</h3>
            <span class="chart-sub">Weekly Performance</span>
         </div>
         <div class="chart-container">
            <canvas #attendanceChart></canvas>
         </div>
      </div>

      <div class="bento-item col-4 chart-item">
         <div class="chart-header">
            <h3 class="chart-title">⭕ Last Sabha Ratio</h3>
            <span class="chart-sub">Present vs Absent vs Leave</span>
         </div>
         <div class="chart-container" style="height: 200px;">
            <canvas #attPieChart></canvas>
         </div>
      </div>

      <div class="bento-item col-12 chart-item">
         <div class="chart-header">
            <h3 class="chart-title">🏢 Activity-wise Contribution</h3>
            <span class="chart-sub">Member Participation & Financial Collection</span>
         </div>
         <div class="activity-stats-grid">
            <div class="chart-container" style="flex: 1; height: 300px;">
               <canvas #activityChart></canvas>
            </div>
            <div class="activity-legend" *ngIf="activityData.length > 0">
               <div *ngFor="let item of activityData" class="legend-item">
                  <div class="legend-header">
                     <span class="legend-dot"></span>
                     <span class="legend-name">{{ item.name }}</span>
                  </div>
                  <div class="legend-stats">
                     <span>👥 {{ item.count }} Members</span>
                     <span class="amount-badge">₹{{ item.amount }}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- OPERATIONS HUB -->
      <div class="bento-item col-12 operations-hub">
         <div class="hub-header">
            <h2 class="hub-title">⚡ Navigation Command</h2>
            <p class="hub-sub">Access system modules instantly</p>
         </div>
         <div class="module-grid-modern">
            <button (click)="router.navigate(['/members'])" class="nav-module mem-bg">
               <div class="nav-icon">👥</div>
               <div class="nav-text">Registry</div>
            </button>
            <button (click)="router.navigate(['/attendance'])" class="nav-module att-bg">
               <div class="nav-icon">📝</div>
               <div class="nav-text">Presence</div>
            </button>
            <button (click)="router.navigate(['/schedule'])" class="nav-module sch-bg">
               <div class="nav-icon">📅</div>
               <div class="nav-text">Schedule</div>
            </button>
            <button (click)="router.navigate(['/wallet'])" class="nav-module wal-bg">
               <div class="nav-icon">💰</div>
               <div class="nav-text">Wallet</div>
            </button>
            <button (click)="router.navigate(['/reports'])" class="nav-module rep-bg">
               <div class="nav-icon">📈</div>
               <div class="nav-text">Audit</div>
            </button>
            <button (click)="router.navigate(['/roles'])" class="nav-module rol-bg">
               <div class="nav-icon">🛡️</div>
               <div class="nav-text">Security</div>
            </button>
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
    .stat-card-premium {
       background: var(--bg-card);
       border: 1px solid var(--border-color);
       padding: 24px;
       border-radius: 28px;
       display: flex;
       flex-direction: column;
       justify-content: space-between;
       transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
       box-shadow: var(--shadow-sm);
    }
    .stat-card-premium:hover { transform: translateY(-6px); border-color: var(--primary); }
    
    .stat-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .stat-icon-box {
       width: 44px; height: 44px; border-radius: 12px;
       display: flex; align-items: center; justify-content: center;
       font-size: 1.2rem; flex-shrink: 0;
    }
    .stat-label { font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-main { display: flex; flex-direction: column; gap: 8px; }
    .stat-number { font-size: 2.8rem; font-weight: 900; color: var(--text-dark); letter-spacing: -0.04em; line-height: 1; }
    .stat-trend { font-size: 0.75rem; font-weight: 800; margin-top: 4px; }
    .stat-trend.success { color: var(--success); }

    .attendance-mini-grid {
       display: grid;
       grid-template-columns: repeat(3, 1fr);
       gap: 8px;
       margin-top: auto;
    }
    .mini-att {
       padding: 10px;
       border-radius: 14px;
       display: flex;
       flex-direction: column;
       align-items: center;
       background: var(--bg-main);
       border: 1px solid var(--border-color);
    }
    .mini-att .v { font-size: 1.2rem; font-weight: 900; }
    .mini-att .l { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; opacity: 0.7; }
    .mini-att.present .v { color: var(--success); }
    .mini-att.absent .v { color: var(--danger); }
    .mini-att.leave .v { color: var(--warning); }

    .chart-item { padding: 24px; border-radius: 28px; background: var(--bg-card); border: 1px solid var(--border-color); }
    .chart-header { margin-bottom: 20px; }
    .chart-title { font-size: 1.1rem; font-weight: 800; color: var(--text-dark); margin: 0; }
    .chart-sub { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
    .chart-container { height: 260px; position: relative; }

    .operations-hub { padding: 32px; border-radius: 32px; background: var(--bg-card); border: 1px solid var(--border-color); margin-top: 12px; }
    .hub-header { margin-bottom: 24px; }
    .hub-title { font-size: 1.4rem; font-weight: 900; color: var(--text-dark); margin: 0; }
    .hub-sub { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }

    .module-grid-modern {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
       gap: 16px;
    }
    .nav-module {
       padding: 20px;
       border-radius: 20px;
       border: 1px solid var(--border-color);
       background: var(--bg-main);
       display: flex;
       flex-direction: column;
       align-items: center;
       gap: 12px;
       cursor: pointer;
       transition: all 0.3s;
       text-align: center;
    }
    .nav-module:hover { transform: scale(1.05); border-color: var(--primary); box-shadow: var(--shadow-sm); }
    .nav-icon { font-size: 1.8rem; }
    .nav-text { font-size: 0.85rem; font-weight: 800; color: var(--text-dark); }

    .quick-action-pill {
       padding: 10px 20px;
       border-radius: 24px;
       font-size: 0.85rem;
       font-weight: 800;
       border: 1px solid var(--border-color);
       background: var(--bg-card);
       color: var(--text-dark);
       white-space: nowrap;
       display: flex;
       align-items: center;
       gap: 8px;
    }

    .mem-icon, .mem-bg { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
    .att-icon, .att-bg { background: rgba(16, 185, 129, 0.1); color: #10B981; }
    .wal-icon, .wal-bg { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
    .sch-icon, .sch-bg { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
    .rep-icon, .rep-bg { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
    .rol-icon, .rol-bg { background: rgba(107, 114, 128, 0.1); color: #6B7280; }

    .activity-stats-grid {
       display: flex;
       gap: 32px;
       align-items: center;
    }
    .activity-legend {
       flex: 1;
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
       gap: 16px;
    }
    .legend-item {
       padding: 16px;
       background: var(--bg-main);
       border-radius: 16px;
       border: 1px solid var(--border-color);
    }
    .legend-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }
    .legend-name { font-weight: 800; font-size: 0.9rem; color: var(--text-dark); }
    .legend-stats { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
    .amount-badge { color: var(--success); background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 6px; }

    @media (max-width: 768px) {
       .activity-stats-grid { flex-direction: column; }
       .activity-legend { width: 100%; }
       .bento-grid { gap: 16px; }
       .stat-number { font-size: 2.2rem; }
       .operations-hub { padding: 24px; }
       .module-grid-modern { grid-template-columns: repeat(3, 1fr); gap: 10px; }
       .nav-module { padding: 14px; border-radius: 16px; }
       .nav-icon { font-size: 1.4rem; }
       .nav-text { font-size: 0.7rem; }
       .chart-container { height: 220px; }
       .page-header h1 { font-size: 1.8rem; }
    }
    @media (max-width: 480px) {
       .module-grid-modern { grid-template-columns: repeat(2, 1fr); }
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
  @ViewChild('attPieChart') attPieCanvas!: ElementRef;
  @ViewChild('activityChart') activityCanvas!: ElementRef;
  
  private attChart: any;
  private attPieChart: any;
  private actChart: any;

  activityData: any[] = [];

  async ngOnInit() {
    await this.loadStats();
  }

  ngAfterViewInit() {
    // Initial empty charts or wait for data
  }

  async loadStats() {
    this.isLoading = true;
    try {
      const [stats, lastSabha, attTrends, actDist] = await Promise.all([
        this.supabase.getOrganizationStats(),
        this.supabase.getLastSabhaStats(),
        this.supabase.getWeeklyAttendanceTrends(),
        this.supabase.getActivityDistribution()
      ]);
      
      this.report = stats;
      this.lastSabha = lastSabha;
      this.activityData = actDist;
      
      this.renderCharts(attTrends, lastSabha, actDist);
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      this.isLoading = false;
    }
  }

  renderCharts(attData: any[], lastSabha: any, actDist: any[]) {
    if (this.attChart) this.attChart.destroy();
    if (this.attPieChart) this.attPieChart.destroy();
    if (this.actChart) this.actChart.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#FDFCFC' : '#2F3035';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Attendance Trend Chart (Line)
    this.attChart = new Chart(this.attendanceCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: attData.map(d => {
          const dt = new Date(d.date);
          const day = String(dt.getDate()).padStart(2, '0');
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          return `${day}-${month}`;
        }),
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

    // Attendance Ratio (Pie)
    if (lastSabha) {
       this.attPieChart = new Chart(this.attPieCanvas.nativeElement, {
         type: 'doughnut',
         data: {
           labels: ['Present', 'Absent', 'Leave'],
           datasets: [{
             data: [lastSabha.present, lastSabha.absent, lastSabha.leave],
             backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
             borderWidth: 0,
             hoverOffset: 4
           }]
         },
         options: {
           responsive: true,
           maintainAspectRatio: false,
           plugins: {
             legend: { position: 'bottom', labels: { color: textColor, font: { weight: 700, size: 10 } } }
           },
           cutout: '70%'
         }
       });
    }

    // Activity Distribution (Pie/Doughnut)
    if (actDist && actDist.length > 0) {
       this.actChart = new Chart(this.activityCanvas.nativeElement, {
         type: 'pie',
         data: {
           labels: actDist.map(d => d.name),
           datasets: [{
             data: actDist.map(d => d.amount),
             backgroundColor: [
               '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'
             ],
             borderWidth: 2,
             borderColor: isDark ? '#1e293b' : '#fff'
           }]
         },
         options: {
           responsive: true,
           maintainAspectRatio: false,
           plugins: {
             legend: { display: false }
           }
         }
       });
    }
  }
}
