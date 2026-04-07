import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-header animate-fade-in">
      <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">📊 System Reports</h1>
      <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500; margin-bottom: 32px;">Export and analyze your historical data in multiple formats.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;" class="animate-slide-up">
      
      <!-- Attendance -->
      <div class="card">
        <div style="font-size: 3rem; margin-bottom: 20px; filter: drop-shadow(0 4px 12px var(--primary-soft));">📑</div>
        <h3 style="margin-bottom: 12px; font-weight: 800; color: var(--text-dark);">Attendance Insight</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; font-weight: 500; margin-bottom: 28px;">Generate detailed member-wise attendance history with monthly summaries and percentage tracking.</p>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" style="flex: 1; justify-content: center; height: 48px; border-radius: var(--radius-md);">📄 PDF Report</button>
          <button class="btn btn-success" style="flex: 1; justify-content: center; height: 48px; border-radius: var(--radius-md);">📊 Excel Data</button>
        </div>
      </div>

      <!-- Financials -->
      <div class="card">
        <div style="font-size: 3rem; margin-bottom: 20px; filter: drop-shadow(0 4px 12px var(--primary-soft));">💳</div>
        <h3 style="margin-bottom: 12px; font-weight: 800; color: var(--text-dark);">Financial Snapshot</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; font-weight: 500; margin-bottom: 28px;">Comprehensive report of all income, expenses, and wallet balances categorized by date range.</p>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" style="flex: 1; justify-content: center; height: 48px; border-radius: var(--radius-md);">📄 PDF Report</button>
          <button class="btn btn-success" style="flex: 1; justify-content: center; height: 48px; border-radius: var(--radius-md);">📊 Excel Data</button>
        </div>
      </div>

      <!-- Transactions -->
      <div class="card">
        <div style="font-size: 3rem; margin-bottom: 20px; filter: drop-shadow(0 4px 12px var(--primary-soft));">🔍</div>
        <h3 style="margin-bottom: 12px; font-weight: 800; color: var(--text-dark);">Transaction Log</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; font-weight: 500; margin-bottom: 28px;">Audit trail of every single wallet transaction, donation, and fine collected within the system.</p>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" style="flex: 1; justify-content: center; height: 48px; border-radius: var(--radius-md);">📄 PDF Report</button>
          <button class="btn btn-success" style="flex: 1; justify-content: center; height: 48px; border-radius: var(--radius-md);">📊 Excel Data</button>
        </div>
      </div>

    </div>

    <!-- Date Filter -->
    <div class="card animate-slide-up" style="margin-top: 32px; max-width: 550px;">
      <h4 style="margin-bottom: 20px; font-weight: 800; color: var(--text-dark);">📅 Global Data Export Range</h4>
      <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 150px;">
           <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block;">Start Date</label>
           <input type="date" class="form-control premium-input">
        </div>
        <span style="color: var(--text-muted); margin-top: 24px; font-weight: 700;">TO</span>
        <div style="flex: 1; min-width: 150px;">
           <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block;">End Date</label>
           <input type="date" class="form-control premium-input">
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {}
