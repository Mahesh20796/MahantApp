import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wallet-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-header animate-fade-in">
      <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">💳 Wallet & Financials</h1>
      <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500; margin-bottom: 32px;">Manage organization funds and member wallet transactions.</p>
    </div>

    <!-- Financial Stats -->
    <div class="stats-grid animate-slide-up">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-soft); color: var(--primary); border: 1px solid var(--border-color);">🏦</div>
        <div>
          <h3 class="form-label" style="margin: 0; margin-bottom: 4px;">Organization Balance</h3>
          <div style="font-size: 2rem; font-weight: 800; color: var(--text-dark); letter-spacing: -0.025em;">₹{{ organizationBalance | number:'1.2-2' }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2);">🕒</div>
        <div>
          <h3 class="form-label" style="margin: 0; margin-bottom: 4px;">Pending Collections</h3>
          <div style="font-size: 2rem; font-weight: 800; color: var(--success); letter-spacing: -0.025em;">₹12,450.00</div>
        </div>
      </div>
    </div>

    <!-- Transaction Form (Hidden by default) -->
    <div *ngIf="showTransactionForm" class="card animate-fade-in" style="margin-top: 24px; border: 2px solid var(--primary); background: var(--bg-main);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 class="card-title" style="margin:0;">{{ transactionType === 'deposit' ? '➕ Fund Deposit' : '➖ Record Withdrawal' }}</h2>
        <button class="btn" (click)="closeForm()" style="background: transparent; color: var(--text-muted);">✕ Close</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; align-items: flex-end;">
        <div class="form-group">
          <label class="form-label">Amount (INR) *</label>
          <input type="number" class="form-control" [(ngModel)]="newTransaction.amount" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label">Description / Purpose *</label>
          <input type="text" class="form-control" [(ngModel)]="newTransaction.description" placeholder="E.g. Monthly Rent or Donation">
        </div>
        <button [disabled]="!newTransaction.amount || !newTransaction.description" 
                class="btn" [ngClass]="transactionType === 'deposit' ? 'btn-success' : 'btn-danger'" 
                (click)="processTransaction()" 
                style="height: 48px; justify-content: center; font-weight: 800;">
          {{ transactionType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal' }}
        </button>
      </div>
    </div>

    <div class="card animate-slide-up" style="margin-top: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; gap: 20px;">
        <div>
           <h2 class="card-title" style="margin: 0;">💸 Transaction Registry</h2>
           <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Audited log of all organization and member financial movements.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-success" (click)="openForm('deposit')" style="padding: 10px 20px; font-weight: 800;">+ Deposit</button>
          <button class="btn btn-danger" (click)="openForm('withdrawal')" style="padding: 10px 20px; font-weight: 800;">- Withdrawal</button>
        </div>
      </div>

      <div class="table-responsive hide-on-mobile">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference / Member</th>
              <th>Classification</th>
              <th>Transaction Amount</th>
              <th style="text-align: right;">Authorization</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of transactions" class="table-row-hover">
              <td style="color: var(--text-muted); font-size: 0.85rem; font-weight: 700;">{{ t.date | date:'dd MMM yyyy' | uppercase }}</td>
              <td>
                <div style="font-weight: 800; color: var(--text-dark); font-size: 0.95rem;">{{ t.description }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">{{ t.reference }}</div>
              </td>
              <td><span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-color);">{{ t.category }}</span></td>
              <td style="font-weight: 800; font-size: 1rem;" [style.color]="t.type === 'deposit' ? 'var(--success)' : 'var(--danger)'">
                {{ t.type === 'deposit' ? '+' : '-' }} ₹{{ t.amount | number:'1.2-2' }}
              </td>
              <td style="text-align: right;"><span class="badge badge-active">{{ t.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile View -->
      <div class="show-on-mobile mobile-card-list">
        <div *ngFor="let t of transactions" class="mobile-card">
           <div class="mobile-card-header">
              <div style="font-weight: 800; font-size: 0.9rem;">{{ t.description }}</div>
              <div style="font-weight: 800;" [style.color]="t.type === 'deposit' ? 'var(--success)' : 'var(--danger)'">
                 {{ t.type === 'deposit' ? '+' : '-' }} ₹{{ t.amount | number:'1.2-2' }}
              </div>
           </div>
           <div class="mobile-card-body">
              <div style="font-size: 0.75rem; color: var(--text-muted);">{{ t.date | date:'shortDate' }} • {{ t.category }}</div>
           </div>
        </div>
      </div>

      <div *ngIf="transactions.length === 0" style="padding: 40px; text-align: center; color: var(--text-muted);">
        No recent transactions found.
      </div>
    </div>
  `
})
export class WalletManagementComponent {
  organizationBalance = 125000.00;
  showTransactionForm = false;
  transactionType: 'deposit' | 'withdrawal' = 'deposit';
  
  newTransaction = {
    amount: null,
    description: ''
  };

  transactions = [
    { 
      date: new Date('2026-04-01'), 
      description: 'Monthly Subscription', 
      reference: 'Member: Ramesh Kumar', 
      category: 'MEMBER_WALLET', 
      amount: 500, 
      type: 'deposit', 
      status: 'COMPLETED' 
    },
    { 
      date: new Date('2026-04-02'), 
      description: 'Hall Booking (Special Sabha)', 
      reference: 'Entity: City Community Center', 
      category: 'ADMIN_EXPENSE', 
      amount: 5000, 
      type: 'withdrawal', 
      status: 'CLEARED' 
    }
  ];

  openForm(type: 'deposit' | 'withdrawal') {
    this.transactionType = type;
    this.showTransactionForm = true;
    this.newTransaction = { amount: null, description: '' };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showTransactionForm = false;
  }

  processTransaction() {
    if (!this.newTransaction.amount || !this.newTransaction.description) return;

    const amount = Number(this.newTransaction.amount);
    
    // Update local state
    if (this.transactionType === 'deposit') {
      this.organizationBalance += amount;
    } else {
      this.organizationBalance -= amount;
    }

    // Add to registry
    this.transactions.unshift({
      date: new Date(),
      description: this.newTransaction.description,
      reference: 'Admin Manual Entry',
      category: this.transactionType === 'deposit' ? 'MANUAL_DEPOSIT' : 'MANUAL_WITHDRAWAL',
      amount: amount,
      type: this.transactionType,
      status: 'COMPLETED'
    });

    // Reset and close
    alert('Transaction processed successfully!');
    this.closeForm();
  }
}

