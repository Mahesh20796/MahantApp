import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wallet-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-header animate-fade-in">
      <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">💳 Wallet & Financials</h1>
      <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500; margin-bottom: 32px;">Manage organization funds and member wallet transactions.</p>
    </div>

    <!-- Financial Stats -->
    <div class="stats-grid animate-slide-up">
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.2);">🏦</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Core Organization Balance</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark);">₹1,25,000.00</div>
        </div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(219, 39, 119, 0.1); color: #db2777; border: 1px solid rgba(219, 39, 119, 0.2);">⏳</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Pending Collections</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #db2777;">₹12,450.00</div>
        </div>
      </div>
    </div>

    <div class="card animate-slide-up" style="margin-top: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
        <h2 class="card-title" style="margin-bottom:0;">💸 Recent Transactions</h2>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-success" style="height: 48px; border-radius: var(--radius-md);">➕ Add Money</button>
          <button class="btn btn-danger" style="height: 48px; border-radius: var(--radius-md);">➖ Expense</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Member</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr class="table-row-hover">
              <td style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">01 Apr 2026</td>
              <td>
                <div style="font-weight: 700; color: var(--text-dark);">Monthly Subscription</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">Member: Ramesh Kumar</div>
              </td>
              <td><span class="badge" style="background: var(--bg-sidebar-hover); color: var(--text-muted); border: 1px solid var(--border-color);">Member Wallet</span></td>
              <td style="font-weight: 800; color: #10b981;">+ ₹500.00</td>
              <td><span class="badge badge-active">Completed</span></td>
            </tr>
            <tr class="table-row-hover">
              <td style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">02 Apr 2026</td>
              <td>
                <div style="font-weight: 700; color: var(--text-dark);">Hall Booking (Special Sabha)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">Entity: City Community Center</div>
              </td>
              <td><span class="badge" style="background: var(--bg-sidebar-hover); color: var(--text-muted); border: 1px solid var(--border-color);">Admin Expense</span></td>
              <td style="font-weight: 800; color: #ef4444;">- ₹5,000.00</td>
              <td><span class="badge badge-active">Cleared</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class WalletManagementComponent {}
