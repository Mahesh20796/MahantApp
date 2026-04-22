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
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">📊 System Reports</h1>
          <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500;">Export and analyze your historical data in multiple formats.</p>
        </div>
        
        <!-- Part Selection Tabs -->
        <div class="segmented-control">
          <button [class.active]="activePart === 'attendance'" (click)="setPart('attendance')">📋 Attendance</button>
          <button [class.active]="activePart === 'financial'" (click)="setPart('financial')">💰 Financial</button>
        </div>
      </div>
    </div>

    <!-- PART 1: ATTENDANCE REPORT -->
    <div *ngIf="activePart === 'attendance'" class="report-section animate-slide-up">
      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
        
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 20px;">📅 Custom Range Report</h3>
          <div style="display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px;">
            <div style="flex: 1;">
              <label class="form-label">Start Date</label>
              <input type="date" class="form-control" [(ngModel)]="attendanceRange.start">
            </div>
            <div style="flex: 1;">
              <label class="form-label">End Date</label>
              <input type="date" class="form-control" [(ngModel)]="attendanceRange.end">
            </div>
            <button class="btn btn-primary" (click)="fetchAttendanceSummary()" style="height: 48px; padding: 0 24px;">Generate</button>
          </div>

          <!-- P/L/A Summary -->
          <div *ngIf="attendanceSummary" class="summary-grid">
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

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn btn-success" (click)="exportToExcel('attendance')" style="flex: 1; justify-content: center; height: 48px;">
               📊 Download Excel
            </button>
            <button class="btn btn-danger" (click)="exportToPDF('attendance')" style="flex: 1; justify-content: center; height: 48px;">
               📄 Download PDF
            </button>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 20px;">🏆 Early Bird Top 3</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 20px;">Members who arrived earliest based on session schedules.</p>
          
          <div class="top-list">
             <div *ngFor="let bird of topBirds; let i = index" class="bird-item">
                <div class="rank">{{ i + 1 }}</div>
                <div class="avatar">{{ bird.name?.charAt(0) }}</div>
                <div style="flex: 1;">
                   <div style="font-weight: 800; font-size: 0.95rem;">{{ bird.name }}</div>
                   <div style="font-size: 0.7rem; color: var(--text-muted);">{{ bird.count }} on-time sessions</div>
                </div>
                <div class="medal" *ngIf="i === 0">🥇</div>
                <div class="medal" *ngIf="i === 1">🥈</div>
                <div class="medal" *ngIf="i === 2">🥉</div>
             </div>
          </div>
        </div>

      </div>

      <!-- History View -->
      <div class="card" style="margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
           <h3 class="card-title">📈 Attendance Sustainability</h3>
           <div class="pill-group">
              <button [class.active]="historyView === '6mo'" (click)="setHistoryView('6mo')">6 Months</button>
              <button [class.active]="historyView === '1yr'" (click)="setHistoryView('1yr')">Yearly</button>
           </div>
        </div>
        <div style="height: 200px; background: var(--bg-main); border-radius: 12px; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
           [ Graph Visualization Placeholder: Historical Trends ]
        </div>
      </div>
    </div>

    <!-- PART 2: FINANCIAL REPORT -->
    <div *ngIf="activePart === 'financial'" class="report-section animate-slide-up">
       <div style="display: grid; grid-template-columns: 1.1fr 1.5fr; gap: 24px;">
          
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

             <div style="display: flex; gap: 12px; margin-top: 32px;">
                <button class="btn btn-success" (click)="exportToExcel('financial_range')" style="flex: 1; justify-content: center; height: 50px;">
                   📊 Excel
                </button>
                <button class="btn btn-danger" (click)="exportToPDF('financial_range')" style="flex: 1; justify-content: center; height: 50px;">
                   📄 PDF
                </button>
             </div>
          </div>

          <!-- Member Wise Card -->
          <div class="card">
             <h3 class="card-title" style="margin-bottom: 8px;">👤 Member Specific Audit</h3>
             <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 24px;">View precise payment timings and history for a specific member.</p>
             
             <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Select Member</label>
                <select class="form-control" [(ngModel)]="selectedMemberId" (change)="fetchMemberReport()">
                   <option [value]="null">-- Choose Member --</option>
                   <option *ngFor="let m of members" [value]="m.id">{{ m.name }}</option>
                </select>
             </div>

             <div *ngIf="selectedMemberId && memberTransactions.length > 0" class="member-history-container">
                <div style="margin-bottom: 20px; padding: 16px; background: var(--bg-main); border-radius: 12px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
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
                         📅 {{ tx.date | date:'dd MMM yyyy' }} at {{ tx.date | date:'shortTime' }}
                      </div>
                   </div>
                   <div *ngIf="memberTransactions.length > 5" style="text-align: center; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-top: 12px; cursor: pointer;">
                      + VIEW ALL {{ memberTransactions.length }} RECORDS
                   </div>
                </div>
             </div>

             <div *ngIf="selectedMemberId && memberTransactions.length === 0" style="padding: 40px; text-align: center;">
                <div style="font-size: 2rem; opacity: 0.5;">🔍</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 12px;">No historical data found for this member.</div>
             </div>
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
    .medal { font-size: 1.2rem; }

    .pill-group {
      background: var(--bg-main);
      border-radius: 12px;
      padding: 4px;
      display: flex;
    }
    .pill-group button {
      border: none;
      background: transparent;
      padding: 6px 16px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }
    .pill-group button.active {
      background: var(--primary);
      color: white;
    }

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
  `]
})
export class ReportsComponent implements OnInit {
  private supabase = inject(SupabaseService);

  activePart: 'attendance' | 'financial' = 'attendance';
  historyView: '6mo' | '1yr' = '6mo';

  attendanceRange = {
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  financialRange = {
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  members: any[] = [];
  selectedMemberId: string | null = null;
  memberTransactions: any[] = [];
  memberTotalContributions: number = 0;

  attendanceSummary: any = null;
  topBirds: any[] = [];
  financialStats = { deposits: 0, withdrawals: 0 };

  async ngOnInit() {
    await this.fetchAttendanceSummary();
    await this.fetchTopBirds();
    this.members = await this.supabase.getMembers();
  }

  setPart(part: 'attendance' | 'financial') {
    this.activePart = part;
  }

  setHistoryView(view: '6mo' | '1yr') {
    this.historyView = view;
  }

  async fetchAttendanceSummary() {
    this.attendanceSummary = await this.supabase.getAttendanceSummaryReport(this.attendanceRange.start, this.attendanceRange.end);
  }

  async fetchTopBirds() {
    this.topBirds = await this.supabase.getTopEarlyBirds(3);
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

  async fetchMemberReport() {
     if (!this.selectedMemberId) {
        this.memberTransactions = [];
        this.memberTotalContributions = 0;
        return;
     }

     const allTx = await this.supabase.getWalletTransactions();
     this.memberTransactions = allTx.filter((t: any) => t.member_id === this.selectedMemberId);
     
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
       doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, pageHeight - 5);
    };

    if (type === 'attendance') {
      doc.setFontSize(12);
      doc.setTextColor(50);
      doc.text(`Attendance Summary Audit: ${this.attendanceRange.start} to ${this.attendanceRange.end}`, 14, 45);
      
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
      doc.text(`Financial Audit Ledger: ${this.financialRange.start} to ${this.financialRange.end}`, 14, 45);
      
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

    } else if (type === 'member_report') {
      const member = this.members.find(m => m.id === this.selectedMemberId);
      doc.text(`Individual Financial Audit Profile: ${member?.name}`, 14, 45);
      doc.setFontSize(10);
      doc.text(`Total Authenticated Contributions: INR ${this.memberTotalContributions.toLocaleString()}`, 14, 52);

      autoTable(doc, {
        startY: 60,
        head: [['Log Date', 'Transaction Description', 'Type', 'Capital Amount']],
        body: this.memberTransactions.map(t => [
          new Date(t.date).toLocaleDateString('en-IN'),
          t.description,
          t.type.toUpperCase(),
          `INR ${t.amount}`
        ]),
        headStyles: { fillColor: [30, 58, 138] },
        didDrawPage: footer
      });
      doc.save(`Rana_Mandal_Report_${member?.name.replace(/\s/g, '_')}.pdf`);
    }
  }
}
