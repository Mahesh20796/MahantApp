import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-wallet-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-header animate-fade-in">
      <div class="page-header" style="margin-bottom: 32px;">
        <div>
          <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px;">💳 Wallet & Financials</h1>
          <p style="color: var(--text-muted); font-size: 1.05rem; font-weight: 500;">Manage organization funds and member wallet transactions.</p>
        </div>
        <div style="display: flex; gap: 12px;">
           <button class="btn btn-success" (click)="openForm('deposit')" style="padding: 12px 20px; font-weight: 800; justify-content: center;">+ Deposit</button>
           <button class="btn btn-danger" (click)="openForm('withdrawal')" style="padding: 12px 20px; font-weight: 800; justify-content: center;">- Withdrawal</button>
        </div>
      </div>
    </div>

    <!-- Financial Stats -->
    <div class="stats-grid animate-slide-up">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-soft); color: var(--primary); border: 1px solid var(--border-color);">🏦</div>
        <div>
          <h3 class="form-label" style="margin: 0; margin-bottom: 4px;">Organization Balance</h3>
          <div style="font-size: 2rem; font-weight: 800; color: var(--text-dark); letter-spacing: -0.025em;">₹{{ stats.totalBalance | number:'1.2-2' }}</div>
          <p style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">Across {{ stats.memberCount }} members</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2);">🕒</div>
        <div>
          <h3 class="form-label" style="margin: 0; margin-bottom: 4px;">Total Transactions</h3>
          <div style="font-size: 2rem; font-weight: 800; color: var(--success); letter-spacing: -0.025em;">{{ transactions.length }}</div>
          <p style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">Last updated just now</p>
        </div>
      </div>
    </div>



    <!-- Transaction Form -->
    <div *ngIf="showTransactionForm" class="card animate-fade-in" style="margin-top: 24px; border: 2px solid var(--primary); background: var(--bg-card); box-shadow: var(--shadow-premium);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 class="card-title" style="margin:0; font-weight: 800;">
          {{ transactionType === 'deposit' ? '➕ New Deposit' : '➖ New Withdrawal' }}
        </h2>
        <button class="btn" (click)="closeForm()" style="background: transparent; color: var(--text-muted); font-weight: 800;">✕ Close</button>
      </div>

      <div class="responsive-grid" style="grid-template-columns: 1fr 1.5fr 1fr 1fr 1.2fr; gap: 16px; align-items: flex-start;">
        <div class="form-group">
          <label class="form-label">Transaction Date *</label>
          <input type="date" class="form-control" [class.is-invalid]="submitted && !newTransaction.date" [(ngModel)]="newTransaction.date">
          <div *ngIf="submitted && !newTransaction.date" class="invalid-feedback">Date required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Member (Optional)</label>
          <select class="form-control" [(ngModel)]="newTransaction.member_id">
            <option [value]="null">Organization General</option>
            <option *ngFor="let m of members" [value]="m.id">{{ m.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Amount (INR) *</label>
          <input type="number" class="form-control" [class.is-invalid]="submitted && !newTransaction.amount" [(ngModel)]="newTransaction.amount" placeholder="0.00">
          <div *ngIf="submitted && !newTransaction.amount" class="invalid-feedback">Amount required</div>
        </div>
        <div class="form-group">
          <label class="form-label">Purpose / Description *</label>
          <input type="text" class="form-control" [class.is-invalid]="submitted && !newTransaction.description" [(ngModel)]="newTransaction.description" placeholder="E.g. Rent, Donation">
          <div *ngIf="submitted && !newTransaction.description" class="invalid-feedback">Description required</div>
        </div>
        <button class="btn" [ngClass]="transactionType === 'deposit' ? 'btn-success' : 'btn-danger'" 
                (click)="processTransaction()" 
                [disabled]="processing"
                style="height: 48px; justify-content: center; font-weight: 800; width: 100%; margin-top: 28px;">
          {{ processing ? 'Processing...' : (transactionType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal') }}
        </button>
      </div>
    </div>

    <div class="card animate-slide-up" style="margin-top: 24px;">
      <div class="page-header" style="margin-bottom: 32px; gap: 20px;">
        <div>
           <h2 class="card-title" style="margin: 0; font-weight: 800; display: flex; align-items: center; gap: 10px;">
            <span style="background: var(--primary-soft); color: var(--primary); padding: 8px; border-radius: 8px;">💸</span>
            Transaction Registry
           </h2>
           <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px; font-weight: 500;">
            Real-time audited log of all financial movements.
           </p>
        </div>

      </div>

      <div class="table-responsive hide-on-mobile" style="min-height: 200px;">
        <div *ngIf="loading" style="padding: 40px; text-align: center;">
          <div class="skeleton" style="height: 40px; margin-bottom: 12px; border-radius: 8px;"></div>
          <div class="skeleton" style="height: 40px; margin-bottom: 12px; border-radius: 8px;"></div>
          <div class="skeleton" style="height: 40px; border-radius: 8px;"></div>
        </div>

        <table *ngIf="!loading" class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference / Member</th>
              <th>Classification</th>
              <th>Transaction Amount</th>
              <th style="text-align: right;">Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of transactions" class="table-row-hover">
              <td style="color: var(--text-muted); font-size: 0.85rem; font-weight: 700;">
                {{ t.date | date:'dd MMM yyyy' | uppercase }}
                <div style="font-size: 0.7rem; color: rgba(0,0,0,0.3);">{{ t.date | date:'shortTime' }}</div>
              </td>
              <td>
                <div style="font-weight: 800; color: var(--text-dark); font-size: 0.95rem;">{{ t.description }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Ref: {{ t.reference }}</div>
              </td>
              <td>
                <span class="badge" 
                  [style.background]="t.category === 'MONTHLY_COLLECTION' ? 'rgba(248, 121, 65, 0.1)' : 'var(--bg-main)'"
                  [style.color]="t.category === 'MONTHLY_COLLECTION' ? 'var(--primary)' : 'var(--text-muted)'"
                  style="border: 1px solid var(--border-color); font-size: 0.65rem;">
                  {{ t.category?.replace('_', ' ') }}
                </span>
              </td>
              <td style="font-weight: 800; font-size: 1.1rem;" [style.color]="t.type === 'deposit' ? 'var(--success)' : 'var(--danger)'">
                {{ t.type === 'deposit' ? '+' : '-' }} ₹{{ t.amount | number:'1.1-1' }}
              </td>
              <td style="text-align: right;"><span class="badge badge-active">{{ t.status || 'COMPLETED' }}</span></td>
              <td style="text-align: right;">
                <button class="btn btn-danger" (click)="deleteTransaction(t.id)" [disabled]="processing" style="padding: 6px 12px; font-size: 0.7rem; border-radius: 6px;">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!loading && transactions.length === 0" style="padding: 60px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 16px;">📉</div>
        <p style="font-weight: 600;">No recent transactions found.</p>
        <p style="font-size: 0.85rem;">Start by adding a deposit or collection.</p>
      </div>
    </div>
  `,
  styles: [`
    .table-row-hover:hover { background: var(--primary-soft); transition: background 0.2s; }
    .form-control.is-invalid { border-color: var(--danger); }
    .invalid-feedback { color: var(--danger); font-size: 0.7rem; font-weight: 700; margin-top: 4px; }
    

  `]
})
export class WalletManagementComponent implements OnInit {
  private supabase = inject(SupabaseService);

  stats = {
    totalBalance: 0,
    pendingCollections: 0,
    memberCount: 0
  };
  
  loading = true;
  processing = false;
  submitted = false;
  showTransactionForm = false;
  transactionType: 'deposit' | 'withdrawal' = 'deposit';
  
  newTransaction: any = {
    amount: null,
    description: '',
    member_id: null,
    date: new Date().toISOString().split('T')[0]
  };

  transactions: any[] = [];
  members: any[] = [];

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [stats, transactions, members] = await Promise.all([
        this.supabase.getOrganizationStats(),
        this.supabase.getWalletTransactions(),
        this.supabase.getMembers()
      ]);
      this.stats = stats;
      this.transactions = transactions;
      this.members = members;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  openForm(type: 'deposit' | 'withdrawal') {
    this.transactionType = type;
    this.showTransactionForm = true;
    this.submitted = false;
    this.newTransaction = { 
      amount: null, 
      description: '', 
      member_id: null,
      date: new Date().toISOString().split('T')[0]
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showTransactionForm = false;
    this.submitted = false;
  }

  async processTransaction() {
    this.submitted = true;
    
    if (!this.newTransaction.amount || !this.newTransaction.description || !this.newTransaction.date) return;

    const amount = Number(this.newTransaction.amount);

    // Validation: Check for insufficient funds during withdrawal
    if (this.transactionType === 'withdrawal') {
      let availableBalance = this.stats.totalBalance; // Default to Org Balance
      
      if (this.newTransaction.member_id) {
        const member = this.members.find(m => m.id === this.newTransaction.member_id);
        availableBalance = member?.wallet_balance || 0;
      }

      if (amount > availableBalance) {
        alert(`❌ Insufficient Funds! Available balance is ₹${availableBalance.toLocaleString()}. You cannot withdraw ₹${amount.toLocaleString()}.`);
        return;
      }
    }

    try {
      this.processing = true;
      const tx = {
        amount: amount,
        description: this.newTransaction.description,
        type: this.transactionType,
        member_id: this.newTransaction.member_id,
        category: this.newTransaction.member_id ? 'MEMBER_ACTION' : 'ORG_GENERAL',
        status: 'COMPLETED',
        created_at: this.newTransaction.date
      };

      await this.supabase.addTransaction(tx);
      this.closeForm();
      await this.loadData();
    } catch (e: any) {
      alert('Error processing transaction: ' + (e.message || e));
    } finally {
      this.processing = false;
    }
  }

  async deleteTransaction(id: string) {
    if (!confirm('Are you sure you want to delete this transaction? This will also revert any associated member balance changes.')) return;
    
    try {
      this.processing = true;
      await this.supabase.deleteTransaction(id);
      await this.loadData();
    } catch (e: any) {
      alert('Error deleting transaction: ' + (e.message || e));
    } finally {
      this.processing = false;
    }
  }
}

