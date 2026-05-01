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

      <div class="responsive-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: flex-start; margin-bottom: 16px;">
        <div class="form-group" style="margin: 0;">
          <label class="form-label">Transaction Date *</label>
          <input type="date" class="form-control" [class.is-invalid]="submitted && !newTransaction.date" [(ngModel)]="newTransaction.date">
          <div *ngIf="submitted && !newTransaction.date" class="invalid-feedback">Date required</div>
        </div>
        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
            Organization
            <a href="javascript:void(0)" (click)="openQuickAddMember()" style="font-size: 0.7rem; color: var(--primary); font-weight: 800; text-decoration: none;">+ Add Org</a>
          </label>
          <select class="form-control" [(ngModel)]="selectedOrganization" (change)="onOrganizationChange()">
            <option [value]="'general'">Organization General</option>
            <option *ngFor="let m of getOrganizations()" [value]="m.id">{{ m.name }}</option>
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label class="form-label">Member Name</label>
          <select class="form-control" [(ngModel)]="selectedMember" (change)="onMemberChange()">
            <option [value]="null">-- Select Member --</option>
            <option *ngFor="let m of getRegularMembers()" [value]="m.id">{{ m.name }}</option>
          </select>
        </div>
      </div>
      
      <div class="responsive-grid" style="grid-template-columns: 1fr 2fr 1fr; gap: 16px; align-items: flex-end;">
        <div class="form-group" style="margin: 0;">
          <label class="form-label">Amount (INR) *</label>
          <input type="number" class="form-control" [class.is-invalid]="submitted && !newTransaction.amount" [(ngModel)]="newTransaction.amount" placeholder="0.00">
          <div *ngIf="submitted && !newTransaction.amount" class="invalid-feedback">Amount required</div>
        </div>
        <div class="form-group" style="margin: 0;">
          <label class="form-label">Purpose / Description *</label>
          <input type="text" class="form-control" [class.is-invalid]="submitted && !newTransaction.description" [(ngModel)]="newTransaction.description" placeholder="E.g. Rent, Donation">
          <div *ngIf="submitted && !newTransaction.description" class="invalid-feedback">Description required</div>
        </div>
        <button class="btn" [ngClass]="transactionType === 'deposit' ? 'btn-success' : 'btn-danger'" 
                (click)="processTransaction()" 
                [disabled]="processing"
                style="height: 48px; justify-content: center; font-weight: 800; width: 100%;">
          {{ processing ? 'Processing...' : (transactionType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal') }}
        </button>
      </div>
    </div>

    <!-- Quick Add Organization / Activity Modal -->
    <div *ngIf="showQuickAddMember" class="modal-backdrop animate-fade-in" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;">
      <div class="card animate-slide-up" style="width: 100%; max-width: 400px; padding: 24px; background: var(--bg-card); box-shadow: var(--shadow-premium);">
        <h3 style="margin-top: 0; margin-bottom: 20px; font-weight: 800;">➕ Add Organization / Activity</h3>
        <div class="form-group">
          <label class="form-label">Organization / Activity Name *</label>
          <input type="text" class="form-control" [(ngModel)]="quickMember.name" placeholder="E.g. Annual Festival">
        </div>
        <div class="form-group">
          <label class="form-label">Activity Date</label>
          <input type="date" class="form-control" [(ngModel)]="quickMember.activityDate">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 28px;">
          <button class="btn" style="flex: 1; background: var(--bg-main); color: var(--text-dark); justify-content: center;" (click)="closeQuickAddMember()">Cancel</button>
          <button class="btn btn-primary" style="flex: 1; justify-content: center;" (click)="saveQuickMember()" [disabled]="quickMemberProcessing">
            {{ quickMemberProcessing ? 'Saving...' : 'Save & Select' }}
          </button>
        </div>
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
                {{ t.date | date:'dd-MM-yyyy' | uppercase }}
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

      <!-- Mobile card layout for Wallet -->
      <div class="show-on-mobile" *ngIf="!loading">
        <div class="mobile-card-list" style="display: flex; flex-direction: column; gap: 14px; padding-bottom: 24px;">
          <div *ngFor="let t of transactions" class="mobile-card" 
               style="border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm); transition: all 0.2s;">
            <div class="mobile-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
               <div style="flex: 1;">
                  <div style="font-weight: 800; color: var(--text-dark); font-size: 1rem; margin-bottom: 2px; letter-spacing: -0.01em;">{{ t.description }}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">📅 {{ t.date | date:'dd-MM-yyyy' }}</div>
               </div>
               <div style="text-align: right;">
                  <div [style.color]="t.type === 'deposit' ? 'var(--success)' : 'var(--danger)'" style="font-weight: 900; font-size: 1.15rem; letter-spacing: -0.02em;">
                    {{ t.type === 'deposit' ? '+' : '-' }} ₹{{ t.amount | number:'1.0-0' }}
                  </div>
                  <span class="badge" 
                        [style.background]="t.type === 'deposit' ? '#DCFCE7' : '#FEE2E2'"
                        [style.color]="t.type === 'deposit' ? '#166534' : '#991B1B'"
                        style="font-size: 0.6rem; padding: 4px 8px; border-radius: 6px; margin-top: 6px; border: 1px solid currentColor;">
                    {{ t.type | uppercase }}
                  </span>
               </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 14px;">
               <div>
                 <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 800; display: block;">REFERENCE ID</span>
                 <span style="font-size: 0.7rem; color: var(--text-dark); font-weight: 700;">{{ t.reference || 'N/A' }}</span>
               </div>
               <button class="btn" (click)="deleteTransaction(t.id)" [disabled]="processing" 
                       style="background: #FFF5F5; color: #EF4444; border: 1px solid #FEE2E2; padding: 8px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                  🗑️ REMOVE
               </button>
            </div>
          </div>
        </div>
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
    .dropdown-item:hover { background-color: var(--primary-soft); transition: background 0.2s; }
    

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
    date: new Date().toISOString().split('T')[0]
  };

  // Two separate selections
  selectedOrganization: string | null = 'general';
  selectedMember: string | null = null;

  getOrganizations() {
    return this.members.filter(m => m.role === 'Organization/Activity');
  }

  getRegularMembers() {
    return this.members.filter(m => m.role !== 'Organization/Activity');
  }

  onOrganizationChange() {
    // Both can now be selected to allow tracking transactions for a member within an organization
  }

  onMemberChange() {
    // Both can now be selected to allow tracking transactions for a member within an organization
  }

  getFinalMemberId() {
    if (this.selectedMember) return this.selectedMember;
    if (this.selectedOrganization && this.selectedOrganization !== 'general') return this.selectedOrganization;
    return null; // Organization General
  }

  dropdownOpen = false;

  // Quick Add Member State
  showQuickAddMember = false;
  quickMemberProcessing = false;
  quickMember = {
    name: '',
    activityDate: new Date().toISOString().split('T')[0]
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
    this.selectedOrganization = 'general';
    this.selectedMember = null;
    this.newTransaction = { 
      amount: null, 
      description: '', 
      date: new Date().toISOString().split('T')[0]
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showTransactionForm = false;
    this.submitted = false;
  }

  openQuickAddMember() {
    this.quickMember = { 
      name: '',
      activityDate: new Date().toISOString().split('T')[0]
    };
    this.showQuickAddMember = true;
  }

  closeQuickAddMember() {
    this.showQuickAddMember = false;
  }

  async saveQuickMember() {
    if (!this.quickMember.name) {
      alert('Please provide an Organization / Activity Name.');
      return;
    }

    this.quickMemberProcessing = true;
    try {
      const payload = {
        name: this.quickMember.name,
        contact_details: '0000000000',
        email_id: `org${Date.now()}@sabha.local`,
        photo: '',
        address: 'N/A',
        role: 'Organization/Activity',
        sabha_name: 'Organization General',
        status: 'Active',
        password: 'password123',
        joining_date: this.quickMember.activityDate || null
      };

      const res = await this.supabase.addMember(payload);
      if (res && res.error) throw res.error;

      // Reload members list to include the newly created one
      this.members = await this.supabase.getMembers();

      // Find the new member ID and automatically select it
      let newMemId = null;
      if (res && res.data && res.data.length > 0) {
        newMemId = res.data[0].id;
      } else {
        const match = this.members.find(m => m.name === this.quickMember.name && m.role === 'Organization/Activity');
        if (match) newMemId = match.id;
      }

      if (newMemId) {
        this.selectedOrganization = newMemId;
        this.selectedMember = null;
      }

      this.closeQuickAddMember();
    } catch (error: any) {
      alert('Error creating organization: ' + (error.message || error));
    } finally {
      this.quickMemberProcessing = false;
    }
  }

  async processTransaction() {
    this.submitted = true;
    
    if (!this.newTransaction.amount || !this.newTransaction.description || !this.newTransaction.date) return;

    const amount = Number(this.newTransaction.amount);
    const finalMemberId = this.getFinalMemberId();

    // Validation: Check for insufficient funds during withdrawal
    if (this.transactionType === 'withdrawal') {
      let availableBalance = this.stats.totalBalance; // Default to Org Balance
      
      if (finalMemberId) {
        const member = this.members.find(m => m.id === finalMemberId);
        availableBalance = member?.wallet_balance || 0;
      }

      if (amount > availableBalance) {
        alert(`❌ Insufficient Funds! Available balance is ₹${availableBalance.toLocaleString()}. You cannot withdraw ₹${amount.toLocaleString()}.`);
        return;
      }
    }

    try {
      this.processing = true;

      // If both organization and member are selected, prepend org name to description for better tracking
      let displayDescription = this.newTransaction.description;
      if (this.selectedMember && this.selectedOrganization && this.selectedOrganization !== 'general') {
        const org = this.members.find(m => m.id === this.selectedOrganization);
        if (org) {
          displayDescription = `[${org.name}] ${displayDescription}`;
        }
      }

      const tx = {
        amount: amount,
        description: displayDescription,
        type: this.transactionType,
        member_id: finalMemberId,
        category: finalMemberId ? 'MEMBER_ACTION' : 'ORG_GENERAL',
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

