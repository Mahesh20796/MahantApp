import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-header animate-fade-in">
      <div class="reports-header-container" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px;">
        <div>
          <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">📊 System Reports</h1>
          <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500;">Export and analyze your historical data in multiple formats.</p>
        </div>
        
        <!-- Part Selection Tabs -->
        <div class="segmented-control hide-on-mobile">
          <button [class.active]="activePart === 'attendance'" (click)="setPart('attendance')">📋 Attendance</button>
          <button [class.active]="activePart === 'financial'" (click)="setPart('financial')">💰 Financial</button>
          <button [class.active]="activePart === 'general'" (click)="setPart('general')">👥 General</button>
        </div>
      </div>

      <!-- Mobile Tabs -->
      <div class="segmented-control show-on-mobile" style="margin-bottom: 24px; width: 100%;">
        <button style="flex: 1; padding: 12px 4px; font-size: 0.75rem;" [class.active]="activePart === 'attendance'" (click)="setPart('attendance')">Attendance</button>
        <button style="flex: 1; padding: 12px 4px; font-size: 0.75rem;" [class.active]="activePart === 'financial'" (click)="setPart('financial')">Financial</button>
        <button style="flex: 1; padding: 12px 4px; font-size: 0.75rem;" [class.active]="activePart === 'general'" (click)="setPart('general')">General</button>
      </div>
    </div>

    <!-- PART 1: ATTENDANCE REPORT -->
    <div *ngIf="activePart === 'attendance'" class="report-section animate-slide-up">
      <div class="report-grid">
        
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 20px;">📅 Custom Range Report</h3>
          <div class="filter-row">
            <div style="flex: 1;">
              <label class="form-label">Member Filter</label>
              <select class="form-control" [(ngModel)]="attendanceSelectedMember">
                 <option [value]="null">All Members</option>
                 <option *ngFor="let m of getRegularMembers()" [value]="m.id">{{ m.name }}</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label class="form-label">Start Date</label>
              <input type="date" class="form-control" [(ngModel)]="attendanceRange.start">
            </div>
            <div style="flex: 1;">
              <label class="form-label">End Date</label>
              <input type="date" class="form-control" [(ngModel)]="attendanceRange.end">
            </div>
            <button class="btn btn-primary generate-btn" (click)="fetchAttendanceSummary()">Generate</button>
          </div>

          <!-- P/L/A Summary -->
          <div *ngIf="attendanceSummary" style="margin-bottom: 24px;">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
               <div class="mini-stat-card transparent" style="flex: 1; border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; background: var(--bg-main);">
                  <span class="mini-label" style="display: block;">Total Attendance</span>
                  <span class="mini-value success">{{ attendanceSummary.P }}</span>
               </div>
               <div class="mini-stat-card transparent" style="flex: 1; border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; background: var(--bg-main);">
                  <span class="mini-label" style="display: block;">Outstanding / Missed</span>
                  <span class="mini-value danger">{{ attendanceSummary.A + attendanceSummary.L }}</span>
               </div>
            </div>

            <div class="summary-grid" style="margin-top: 0;">
              <div class="summary-item present">
                <span class="label">PRESENT (P)</span>
                <span class="value">{{ attendanceSummary.P }}</span>
              </div>
              <div class="summary-item absent">
                <span class="label">ABSENT (A)</span>
                <span class="value">{{ attendanceSummary.A }}</span>
              </div>
              <div class="summary-item leave">
                <span class="label">LEAVE (L)</span>
                <span class="value">{{ attendanceSummary.L }}</span>
              </div>
            </div>
          </div>

          <div class="action-buttons-row">
            <button class="btn btn-success" (click)="exportToExcel('attendance')" style="flex: 1; justify-content: center; height: 48px;">
               📊 Excel
            </button>
            <button class="btn btn-danger" (click)="exportToPDF('attendance')" style="flex: 1; justify-content: center; height: 48px;">
               📄 PDF
            </button>
          </div>
        </div>

        <div class="card excellence-card animate-fade-in">
          <div class="card-header-modern">
            <h3 class="card-title-modern">📊 Attendance Excellence</h3>
            <p class="card-subtitle-modern">Top performers based on total working hours in selected period</p>
          </div>
          
          <div class="filter-row mini-filter excellence-filters">
            <div style="flex: 1;">
              <label class="form-label">From Date</label>
              <input type="date" class="form-control premium-input" [(ngModel)]="leaderboardRange.start">
            </div>
            <div style="flex: 1;">
              <label class="form-label">To Date</label>
              <input type="date" class="form-control premium-input" [(ngModel)]="leaderboardRange.end">
            </div>
            <button class="btn btn-generate-report" (click)="fetchLeaderboard()" [disabled]="isLoadingLeaderboard">
               <span *ngIf="!isLoadingLeaderboard">⚡ Generate Report</span>
               <span *ngIf="isLoadingLeaderboard" class="spinner-small"></span>
            </button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!hasGeneratedLeaderboard" class="empty-state-container">
             <div class="empty-state-icon">📝</div>
             <p>Select date range and generate report</p>
          </div>

          <!-- Loading State (Skeleton) -->
          <div *ngIf="isLoadingLeaderboard" class="loading-state-container">
             <div *ngFor="let i of [1,2,3]" class="skeleton bird-skeleton"></div>
          </div>

          <!-- Results Section -->
          <div class="top-list" *ngIf="hasGeneratedLeaderboard && !isLoadingLeaderboard">
             <div *ngFor="let bird of topBirds; let i = index" class="bird-item-modern" 
                  [class.gold-border]="i === 0" [class.silver-border]="i === 1" [class.bronze-border]="i === 2">
                <div class="rank-modern" [class.rank-1]="i === 0" [class.rank-2]="i === 1" [class.rank-3]="i === 2">{{ i + 1 }}</div>
                <div class="avatar-modern" [style.background]="getAvatarBg(i)">{{ bird.name?.charAt(0) }}</div>
                <div style="flex: 1;">
                   <div class="bird-name-modern">{{ bird.name }}</div>
                   <div class="bird-stats-modern">
                      <span>✅ {{ bird.count }} Presents</span>
                      <span class="hours-highlight">⏱️ {{ (bird.count * 1.5).toFixed(1) }} Hours</span>
                   </div>
                </div>
                <div class="medal-modern" *ngIf="i === 0">🥇</div>
                <div class="medal-modern" *ngIf="i === 1">🥈</div>
                <div class="medal-modern" *ngIf="i === 2">🥉</div>
             </div>
             
             <div *ngIf="topBirds.length === 0" class="no-data-message">
                No data for this period. Try adjusting your dates.
             </div>
          </div>
        </div>

      </div>
    </div>

    <!-- PART 2: FINANCIAL REPORT -->
    <div *ngIf="activePart === 'financial'" class="report-section animate-slide-up">
       <div class="report-grid financial-grid">
          
          <!-- Manual Range Card -->
          <div class="card">
             <h3 class="card-title" style="margin-bottom: 24px;">📅 Period Audit Ledger</h3>
             <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
               <div style="display: flex; gap: 12px;">
                  <div style="flex: 1;">
                     <label class="form-label">Period Start</label>
                     <input type="date" class="form-control" [(ngModel)]="financialRange.start">
                  </div>
                  <div style="flex: 1;">
                     <label class="form-label">Period End</label>
                     <input type="date" class="form-control" [(ngModel)]="financialRange.end">
                  </div>
               </div>
               <button class="btn btn-primary" (click)="fetchFinancialReport()" style="height: 48px; justify-content: center;">Generate Range Summary</button>
             </div>

             <div class="mini-stat-column">
                <div class="mini-stat-card transparent">
                   <span class="mini-label">Total Deposits</span>
                   <span class="mini-value success">+ ₹{{ financialStats.deposits | number:'1.0-0' }}</span>
                </div>
                <div class="mini-stat-card transparent">
                   <span class="mini-label">Total Withdrawals</span>
                   <span class="mini-value danger">- ₹{{ financialStats.withdrawals | number:'1.0-0' }}</span>
                </div>
                <div class="divider"></div>
                <div class="mini-stat-card transparent">
                   <span class="mini-label">Net Balance Change</span>
                   <span class="mini-value primary">₹{{ (financialStats.deposits - financialStats.withdrawals) | number:'1.2-2' }}</span>
                </div>
             </div>

             <div class="action-buttons-row" style="margin-top: 32px;">
                <button class="btn btn-success" (click)="exportToExcel('financial_range')" style="flex: 1; justify-content: center; height: 50px;">
                   📊 Excel
                </button>
                <button class="btn btn-danger" (click)="exportToPDF('financial_range')" style="flex: 1; justify-content: center; height: 50px;">
                   📄 PDF
                </button>
             </div>
          </div>

          <!-- Activity-wise Report Card -->
          <div class="card">
             <h3 class="card-title" style="margin-bottom: 8px;">🏢 Activity-wise Report</h3>
             <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 24px;">View historical collections and expenses for a specific activity or organization.</p>
             
             <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Select Activity / Organization</label>
                <select class="form-control" [(ngModel)]="selectedOrganization" (change)="fetchOrganizationReport()">
                   <option [value]="null">-- Choose Activity --</option>
                   <option [value]="'general'">Organization General</option>
                   <option *ngFor="let m of getOrganizations()" [value]="m.id">{{ m.name }}</option>
                </select>
             </div>

             <div *ngIf="selectedOrganization && orgTransactions.length > 0" class="member-history-container">
                <div class="member-summary-box">
                   <div style="flex: 1;">
                      <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Deposits</div>
                      <div style="font-size: 1.4rem; font-weight: 900; color: var(--success);">₹{{ orgTotalContributions | number:'1.0-0' }}</div>
                   </div>
                   <div style="flex: 1; border-left: 1px solid var(--border-color); padding-left: 20px;">
                      <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Amount</div>
                      <div style="font-size: 1.4rem; font-weight: 900; color: var(--primary);">₹{{ orgNetBalance | number:'1.0-0' }}</div>
                   </div>
                   <button class="btn btn-primary" (click)="exportToPDF('org_report')" style="height: 38px; padding: 0 16px; font-size: 0.75rem;">Download Report</button>
                </div>

                <div class="transaction-timeline">
                   <div *ngFor="let tx of orgTransactions.slice(0, 5)" class="timeline-item">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                         <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-dark);">{{ tx.description }}</span>
                         <span [class]="tx.type === 'deposit' ? 'text-success' : 'text-danger'" style="font-weight: 800;">
                            {{ tx.type === 'deposit' ? '+' : '-' }} ₹{{ tx.amount }}
                         </span>
                      </div>
                      <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 12px;">
                         <span>📅 {{ tx.date | date:'dd-MM-yyyy' }}</span>
                         <span *ngIf="tx.reference" style="font-weight: 700; color: var(--primary);">👤 {{ tx.reference }}</span>
                      </div>
                   </div>
                   <div *ngIf="orgTransactions.length > 5" style="text-align: center; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-top: 12px; cursor: pointer;">
                      + VIEW ALL {{ orgTransactions.length }} RECORDS
                   </div>
                </div>
             </div>

             <div *ngIf="selectedOrganization && orgTransactions.length === 0" style="padding: 40px; text-align: center;">
                <div style="font-size: 2rem; opacity: 0.5;">🔍</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 12px;">No historical data found for this activity.</div>
             </div>
          </div>

          <!-- Member Wise Card -->
          <div class="card">
             <h3 class="card-title" style="margin-bottom: 8px;">👤 Member-wise Report</h3>
             <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 24px;">View precise payment timings and history for a specific member.</p>
             
             <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Select Member Name</label>
                <select class="form-control" [(ngModel)]="selectedMember" (change)="fetchMemberReport()">
                   <option [value]="null">-- Choose Member --</option>
                   <option *ngFor="let m of getRegularMembers()" [value]="m.id">{{ m.name }}</option>
                </select>
             </div>

             <div *ngIf="selectedMember && memberTransactions.length > 0" class="member-history-container">
                <div class="member-summary-box">
                   <div>
                      <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Contributions</div>
                      <div style="font-size: 1.4rem; font-weight: 900; color: var(--success);">₹{{ memberTotalContributions | number:'1.0-0' }}</div>
                   </div>
                   <button class="btn btn-primary" (click)="exportToPDF('member_report')" style="height: 38px; padding: 0 16px; font-size: 0.75rem;">Download Profile</button>
                </div>

                <div class="transaction-timeline">
                   <div *ngFor="let tx of memberTransactions.slice(0, 5)" class="timeline-item">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                         <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-dark);">{{ tx.description }}</span>
                         <span [class]="tx.type === 'deposit' ? 'text-success' : 'text-danger'" style="font-weight: 800;">
                            {{ tx.type === 'deposit' ? '+' : '-' }} ₹{{ tx.amount }}
                         </span>
                      </div>
                      <div style="font-size: 0.7rem; color: var(--text-muted);">
                         📅 {{ tx.date | date:'dd-MM-yyyy' }}
                      </div>
                   </div>
                   <div *ngIf="memberTransactions.length > 5" style="text-align: center; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-top: 12px; cursor: pointer;">
                      + VIEW ALL {{ memberTransactions.length }} RECORDS
                   </div>
                </div>
             </div>

             <div *ngIf="selectedMember && memberTransactions.length === 0" style="padding: 40px; text-align: center;">
                <div style="font-size: 2rem; opacity: 0.5;">🔍</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 12px;">No historical data found for this member.</div>
             </div>
          </div>
       </div>
    </div>

    <!-- PART 3: GENERAL REPORT -->
    <div *ngIf="activePart === 'general'" class="report-section animate-slide-up">
       <div class="card" style="max-width: 800px; margin: 0 auto;">
          <h3 class="card-title" style="margin-bottom: 8px;">👥 Member Registry Export</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 24px;">Select the specific registry fields you want to include in your generated report. Only selected fields will reflect in the PDF and Excel.</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; background: var(--bg-main); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color);">
             <label *ngFor="let field of memberExportFields" style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: var(--text-dark); font-size: 0.9rem;">
                <input type="checkbox" [(ngModel)]="field.selected" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;">
                {{ field.label }}
             </label>
          </div>

          <div style="display: flex; gap: 16px;">
             <button class="btn btn-success" (click)="exportRegistryExcel()" style="flex: 1; height: 48px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
                📊 Download Excel
             </button>
             <button class="btn btn-primary" (click)="exportRegistryPDF()" style="flex: 1; height: 48px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
                📄 Download PDF
             </button>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .segmented-control {
      background: var(--bg-sidebar-hover);
      padding: 6px;
      border-radius: 16px;
      display: flex;
      gap: 4px;
      border: 1px solid var(--border-color);
    }
    .segmented-control button {
      border: none;
      background: transparent;
      padding: 10px 24px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .segmented-control button.active {
      background: var(--bg-card);
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 24px;
    }
    .summary-item {
      padding: 20px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary-item.present { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
    .summary-item.absent { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
    .summary-item.leave { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); }
    
    .summary-item .label { font-size: 0.65rem; font-weight: 800; opacity: 0.7; }
    .summary-item .value { font-size: 1.8rem; font-weight: 800; }

    .top-list { display: flex; flex-direction: column; gap: 12px; }
    .bird-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-main);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }
    .bird-item .rank { width: 28px; font-weight: 800; color: var(--primary); font-size: 1.1rem; }
    .bird-item .avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--primary-soft); color: var(--primary); display: flex; justify-content: center; font-weight: 800; align-items: center; }
    .bird-item.gold { background: rgba(30, 58, 138, 0.05); border-color: rgba(30, 58, 138, 0.2); }
    .medal { font-size: 1.2rem; }

    .mini-stat-card {
      padding: 24px;
      background: var(--bg-main);
      border-radius: 20px;
      border: 1px solid var(--border-color);
    }
    .mini-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
    .mini-value { font-size: 1.8rem; font-weight: 800; }
    .mini-stat-card.transparent {
      background: transparent;
      padding: 12px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: none;
      border-radius: 0;
    }
    .divider { height: 1px; background: var(--border-color); margin: 8px 0; }

    .mini-stat-column { display: flex; flex-direction: column; }
    .mini-value.success { color: var(--success); }
    .mini-value.danger { color: var(--danger); }
    .mini-value.primary { color: var(--primary); }

    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }

    .member-history-container {
       margin-top: 10px;
    }
    .transaction-timeline {
       display: flex;
       flex-direction: column;
       gap: 16px;
    }
    .timeline-item {
       padding-bottom: 12px;
       border-bottom: 1px solid var(--bg-sidebar-hover);
    }
    .timeline-item:last-child { border-bottom: none; }

    .report-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 24px;
    }

    .generate-btn {
      height: 48px;
      padding: 0 24px;
    }

    .action-buttons-row {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .member-summary-box {
      margin-bottom: 20px;
      padding: 16px;
      background: var(--bg-main);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .report-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .mini-filter {
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 16px;
      }

      .action-buttons-row {
        flex-direction: column;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .member-summary-box {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .member-summary-box button {
        width: 100%;
      }

      .excellence-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-generate-report {
        width: 100%;
      }
    }

    .excellence-card {
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-premium);
    }

    .card-header-modern {
      margin-bottom: 24px;
    }

    .card-title-modern {
      font-size: 1.4rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
      color: var(--text-dark);
    }

    .card-subtitle-modern {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .btn-generate-report {
      height: 48px;
      padding: 0 24px;
      background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    }

    .btn-generate-report:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(30, 58, 138, 0.3);
      filter: brightness(1.1);
    }

    .empty-state-container {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .bird-item-modern {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      margin-bottom: 12px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bird-item-modern:hover {
      transform: scale(1.02);
      border-color: var(--primary);
      box-shadow: var(--shadow-md);
    }

    .rank-modern {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      border-radius: 50%;
      background: var(--bg-main);
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .rank-1 { background: #FEF3C7; color: #92400E; }
    .rank-2 { background: #F1F5F9; color: #475569; }
    .rank-3 { background: #FFEDD5; color: #9A3412; }

    .gold-border { border-left: 4px solid #FFD700; }
    .silver-border { border-left: 4px solid #C0C0C0; }
    .bronze-border { border-left: 4px solid #CD7F32; }

    .avatar-modern {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      font-size: 1.1rem;
    }

    .bird-name-modern {
      font-weight: 800;
      font-size: 1rem;
      color: var(--text-dark);
      margin-bottom: 4px;
    }

    .bird-stats-modern {
      display: flex;
      gap: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .hours-highlight {
      color: var(--primary);
      background: var(--primary-soft);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .medal-modern {
      font-size: 1.5rem;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .bird-skeleton {
      height: 76px;
      margin-bottom: 12px;
      border-radius: 16px;
    }

    .loading-state-container {
      padding: 8px 0;
    }

    .no-data-message {
      padding: 40px;
      text-align: center;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.9rem;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private supabase = inject(SupabaseService);


  isLoadingLeaderboard = false;
  hasGeneratedLeaderboard = false;

  attendanceRange = {
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };
  attendanceSelectedMember: string | null = null;

  activePart: 'attendance' | 'financial' | 'general' = 'attendance';
  
  memberExportFields = [
    { key: 'name', label: 'Full Legal Name', selected: true },
    { key: 'email_id', label: 'Email Address', selected: true },
    { key: 'role', label: 'System Role', selected: true },
    { key: 'contact_details', label: 'Primary Contact', selected: true },
    { key: 'password', label: 'Login Password', selected: false },
    { key: 'sabha_name', label: 'Branch/Sabha', selected: false },
    { key: 'address', label: 'Residential Address', selected: false },
    { key: 'status', label: 'Account Status', selected: false }
  ];

  financialRange = {
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  members: any[] = [];
  selectedOrganization: string | null = null;
  selectedMember: string | null = null;
  
  memberTransactions: any[] = [];
  memberTotalContributions: number = 0;

  orgTransactions: any[] = [];
  orgTotalContributions: number = 0;
  orgNetBalance: number = 0;

  getOrganizations() {
    return this.members.filter(m => m.role === 'Organization/Activity');
  }

  getRegularMembers() {
    return this.members.filter(m => m.role !== 'Organization/Activity');
  }

  leaderboardRange = {
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  attendanceSummary: any = null;
  topBirds: any[] = [];
  financialStats = { deposits: 0, withdrawals: 0 };

  async ngOnInit() {
    await this.fetchAttendanceSummary();
    await this.fetchLeaderboard();
    this.supabase.getMembers().then(m => {
      this.members = m;
    });
  }

  setPart(part: 'attendance' | 'financial' | 'general') {
    this.activePart = part;
  }


  async fetchAttendanceSummary() {
    this.attendanceSummary = await this.supabase.getAttendanceSummaryReport(
      this.attendanceRange.start, 
      this.attendanceRange.end,
      this.attendanceSelectedMember || undefined
    );
  }

  async fetchLeaderboard() {
    this.isLoadingLeaderboard = true;
    this.hasGeneratedLeaderboard = true;
    
    try {
      // Small artificial delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 800));
      this.topBirds = await this.supabase.getTopEarlyBirds(10, this.leaderboardRange.start, this.leaderboardRange.end);
    } catch (e) {
      console.error('Leaderboard error', e);
    } finally {
      this.isLoadingLeaderboard = false;
    }
  }

  getAvatarBg(index: number): string {
    const colors = ['#1e3a8a', '#ca8a04', '#10b981', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
  }

  async fetchFinancialReport() {
    const allTx = await this.supabase.getWalletTransactions();
    const rangeTx = allTx.filter((t: any) => {
       const d = new Date(t.date).toISOString().split('T')[0];
       return d >= this.financialRange.start && d <= this.financialRange.end;
    });

    this.financialStats = rangeTx.reduce((acc: any, curr: any) => {
      if (curr.type === 'deposit') acc.deposits += curr.amount;
      else acc.withdrawals += curr.amount;
      return acc;
    }, { deposits: 0, withdrawals: 0 });

    return rangeTx;
  }

  async fetchOrganizationReport() {
     if (!this.selectedOrganization) {
        this.orgTransactions = [];
        this.orgTotalContributions = 0;
        return;
     }

     const allTx = await this.supabase.getWalletTransactions();
     
     if (this.selectedOrganization === 'general') {
       this.orgTransactions = allTx.filter((t: any) => !t.member_id);
     } else {
       const org = this.members.find(m => m.id === this.selectedOrganization);
        const orgName = org?.name;
        this.orgTransactions = allTx.filter((t: any) => {
          // Direct link to organization ID
          if (t.member_id === this.selectedOrganization) return true;
          
          // Linked to a member but tagged with organization name in brackets [Org Name]
          if (orgName && t.description && t.description.includes(`[${orgName}]`)) return true;
          
          return false;
        });

     }
     
     this.orgTotalContributions = this.orgTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
        
     const totalWithdrawals = this.orgTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);
        
     this.orgNetBalance = this.orgTotalContributions - totalWithdrawals;
  }

  async fetchMemberReport() {
     if (!this.selectedMember) {
        this.memberTransactions = [];
        this.memberTotalContributions = 0;
        return;
     }

     const allTx = await this.supabase.getWalletTransactions();
     this.memberTransactions = allTx.filter((t: any) => t.member_id === this.selectedMember);
     
     this.memberTotalContributions = this.memberTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
  }

  exportToExcel(type: string) {
    let data: any[] = [];
    let fileName = 'report.xlsx';

    if (type === 'attendance') {
      data = [
        { Category: 'PRESENT', Count: this.attendanceSummary.P },
        { Category: 'ABSENT', Count: this.attendanceSummary.A },
        { Category: 'LEAVE', Count: this.attendanceSummary.L }
      ];
      fileName = `Rana_Mandal_Attendance_${this.attendanceRange.start}_to_${this.attendanceRange.end}.xlsx`;
    } else if (type === 'financial_range') {
      data = [
        { Metric: 'Total Deposits', Value: this.financialStats.deposits },
        { Metric: 'Total Withdrawals', Value: this.financialStats.withdrawals },
        { Metric: 'Net Change', Value: this.financialStats.deposits - this.financialStats.withdrawals }
      ];
      fileName = `Rana_Mandal_Financial_Ledger_${this.financialRange.start}_to_${this.financialRange.end}.xlsx`;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fileName);
  }

  async getBase64Image(url: string): Promise<string> {
     try {
       const response = await fetch(url);
       const blob = await response.blob();
       return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result as string);
         reader.onerror = reject;
         reader.readAsDataURL(blob);
       });
     } catch (e) {
       console.error('Logo loading failed', e);
       return '';
     }
  }

  formatDateDMY(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getFormattedDate(): string {
     const now = new Date();
     const day = String(now.getDate()).padStart(2, '0');
     const month = String(now.getMonth() + 1).padStart(2, '0');
     const year = now.getFullYear();
     const hours = String(now.getHours()).padStart(2, '0');
     const minutes = String(now.getMinutes()).padStart(2, '0');
     const seconds = String(now.getSeconds()).padStart(2, '0');
     return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  async exportToPDF(type: string) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Fetch and add logo
    const logoBase64 = await this.getBase64Image('assets/logo.png');
    if (logoBase64) {
       doc.addImage(logoBase64, 'PNG', 14, 10, 22, 22);
    }

    // Styled Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Primary blue color
    doc.text('RANA MANDAL SABHA', 40, 20);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('A Center for Administrative Excellence', 40, 26);
    doc.line(14, 35, pageWidth - 14, 35);

    const footer = (data: any) => {
       const str = `Page ${data.pageNumber}`;
       doc.setFontSize(9);
       doc.setTextColor(150);
       doc.text(str, pageWidth - 25, pageHeight - 10);
       doc.text('© 2026 Rana Mandal - Official System Report', 14, pageHeight - 10);
       doc.text(`Generated on: ${this.getFormattedDate()}`, 14, pageHeight - 5);
    };

    if (type === 'attendance') {
      doc.setFontSize(12);
      doc.setTextColor(50);
      let title = `Attendance Summary Audit: ${this.formatDateDMY(this.attendanceRange.start)} to ${this.formatDateDMY(this.attendanceRange.end)}`;
      if (this.attendanceSelectedMember) {
        const m = this.members.find(x => x.id === this.attendanceSelectedMember);
        if (m) title += ` | Member: ${m.name}`;
      }
      doc.text(title, 14, 45);
      
      autoTable(doc, {
        startY: 52,
        head: [['Metric Category', 'Total Records']],
        body: [
          ['Present (P) Logs', this.attendanceSummary.present_count || this.attendanceSummary.P],
          ['Absent (A) Logs', this.attendanceSummary.absent_count || this.attendanceSummary.A],
          ['Leave (L) Logs', this.attendanceSummary.leave_count || this.attendanceSummary.L]
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
        didDrawPage: footer
      });
      doc.save(`Rana_Mandal_Attendance_${this.attendanceRange.start}.pdf`);

    } else if (type === 'financial_range') {
      doc.setFontSize(12);
      doc.setTextColor(50);
      doc.text(`Financial Audit Ledger: ${this.formatDateDMY(this.financialRange.start)} to ${this.formatDateDMY(this.financialRange.end)}`, 14, 45);
      
      autoTable(doc, {
        startY: 52,
        head: [['Audit Metric', 'Amount (INR)']],
        body: [
          ['Total Cash Deposits', `+ INR ${this.financialStats.deposits.toLocaleString()}`],
          ['Total Cash Withdrawals', `- INR ${this.financialStats.withdrawals.toLocaleString()}`],
          ['Net Operational Balance', `INR ${(this.financialStats.deposits - this.financialStats.withdrawals).toLocaleString()}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
        didDrawPage: footer
      });
      doc.save(`Rana_Mandal_Financial_${this.financialRange.start}.pdf`);

    } else if (type === 'org_report') {
      let profileName = 'Organization General';
      if (this.selectedOrganization !== 'general') {
        const member = this.members.find(m => m.id === this.selectedOrganization);
        if (member) profileName = member.name;
      }
      
      doc.text(`Activity Name: ${profileName}`, 14, 45);
      doc.setFontSize(10);

      autoTable(doc, {
        startY: 60,
        head: [['Log Date', 'Member / Reference', 'Transaction Description', 'Type', 'Capital Amount']],
        body: this.orgTransactions.map(t => [
          this.formatDateDMY(t.date),
          t.reference || 'N/A',
          t.description,
          t.type.toUpperCase(),
          `INR ${t.amount}`
        ]),
        foot: [[
          { content: 'Total Amount', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `INR ${this.orgNetBalance.toLocaleString()}`, styles: { fontStyle: 'bold' } }
        ]],
        headStyles: { fillColor: [230, 81, 0] },
        footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
        didDrawPage: footer
      });
      doc.save(`Rana_Mandal_Activity_${profileName.replace(/\s/g, '_')}.pdf`);
      
    } else if (type === 'member_report') {
      let profileName = 'Member Profile';
      const member = this.members.find(m => m.id === this.selectedMember);
      if (member) profileName = member.name;
      
      doc.text(`Individual Financial Audit Profile: ${profileName}`, 14, 45);
      doc.setFontSize(10);
      doc.text(`Total Authenticated Contributions: INR ${this.memberTotalContributions.toLocaleString()}`, 14, 52);

      autoTable(doc, {
        startY: 60,
        head: [['Log Date', 'Transaction Description', 'Type', 'Capital Amount']],
        body: this.memberTransactions.map(t => [
          this.formatDateDMY(t.date),
          t.description,
          t.type.toUpperCase(),
          `INR ${t.amount}`
        ]),
        headStyles: { fillColor: [30, 58, 138] },
        didDrawPage: footer
      });
      doc.save(`Rana_Mandal_Report_${profileName.replace(/\s/g, '_')}.pdf`);
    }
  }

  async exportRegistryPDF() {
     const selectedFields = this.memberExportFields.filter(f => f.selected);
     if (selectedFields.length === 0) {
        alert("Please select at least one field to export.");
        return;
     }

     const doc = new jsPDF('landscape');
     const pageWidth = doc.internal.pageSize.getWidth();
     const pageHeight = doc.internal.pageSize.getHeight();
     
     // Fetch and add logo
     const logoBase64 = await this.getBase64Image('assets/logo.png');
     if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 10, 22, 22);
     }

     // Styled Header
     doc.setFontSize(22);
     doc.setTextColor(30, 58, 138); // Primary blue color
     doc.text('RANA MANDAL SABHA', 40, 20);
     doc.setFontSize(10);
     doc.setTextColor(150);
     doc.text('A Center for Administrative Excellence', 40, 26);
     doc.line(14, 35, pageWidth - 14, 35);

     // Document Specific Title
     doc.setFontSize(14);
     doc.setTextColor(30, 58, 138);
     doc.text('Rana Mandal Yuvak Details', 14, 45);

     doc.setFontSize(10);
     doc.setTextColor(100);
     
     // Format date dd/MM/yyyy
     const formattedDate = this.getFormattedDate();
     
     doc.text(`Generated on: ${formattedDate}`, 14, 52);
     
     const headers = selectedFields.map(f => f.label);
     const body = this.members.filter(m => m.role !== 'Organization/Activity').map(m => {
        return selectedFields.map(f => {
           if (f.key === 'joining_date') {
             return m[f.key] ? this.formatDateDMY(m[f.key]) : 'N/A';
           }
           if (f.key === 'balance') {
             return `INR ${m[f.key] || 0}`;
           }
           return m[f.key] || 'N/A';
        });
     });

     const footer = (data: any) => {
        const str = `Page ${data.pageNumber}`;
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(str, pageWidth - 25, pageHeight - 10);
        doc.text('© 2026 Rana Mandal - Official System Report', 14, pageHeight - 10);
        doc.text(`Generated on: ${formattedDate}`, 14, pageHeight - 5);
     };

     autoTable(doc, {
       startY: 58,
       head: [headers],
       body: body,
       theme: 'striped',
       headStyles: { fillColor: [30, 58, 138] },
       styles: { fontSize: 9 },
       didDrawPage: footer
     });

     doc.save('Rana_Mandal_Yuvak_Details.pdf');
  }

  exportRegistryExcel() {
     const selectedFields = this.memberExportFields.filter(f => f.selected);
     if (selectedFields.length === 0) {
        alert("Please select at least one field to export.");
        return;
     }

     const data = this.members.filter(m => m.role !== 'Organization/Activity').map(m => {
        const row: any = {};
        selectedFields.forEach(f => {
           if (f.key === 'joining_date') {
             row[f.label] = m[f.key] ? this.formatDateDMY(m[f.key]) : 'N/A';
           } else if (f.key === 'balance') {
             row[f.label] = m[f.key] || 0;
           } else {
             row[f.label] = m[f.key] || 'N/A';
           }
        });
        return row;
     });

     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
     const wb: XLSX.WorkBook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, 'Registry');
     XLSX.writeFile(wb, 'Rana_Mandal_Registry_Report.xlsx');
  }
}
