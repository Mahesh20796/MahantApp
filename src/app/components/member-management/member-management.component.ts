import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Member } from '../../models/member.model';

@Component({
  selector: 'app-member-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="card animate-fade-in" style="margin-bottom: 24px; position: relative;">
      <div *ngIf="isLoading" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--glass-bg); display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: var(--radius-lg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border);">
        <div style="font-weight: 800; color: var(--primary); display: flex; flex-direction: column; align-items: center; gap: 16px;">
           <span style="font-size: 3rem; animation: spin 2s linear infinite; filter: drop-shadow(0 0 10px var(--primary));">⚙️</span>
           <span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.8rem;">Synchronizing Registry</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 class="card-title" style="margin-bottom: 4px;">👥 Member Management</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Register, manage, and track organization members.</p>
        </div>
        <button class="btn" [ngClass]="showForm ? 'btn-danger' : 'btn-primary'" (click)="toggleForm()" style="height: 44px; border-radius: 12px;">
          {{ showForm ? '✕ Close Form' : '+ New Registration' }}
        </button>
      </div>

      <div *ngIf="showForm" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="memberForm" (ngSubmit)="onSubmit()">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
            
            <div style="grid-column: span 3; display: flex; justify-content: center; margin-bottom: 20px;">
              <div (click)="photoInput.click()" style="width: 100px; height: 100px; border-radius: 24px; background: var(--bg-sidebar-hover); border: 2px dashed var(--border-color); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s;">
                <img *ngIf="memberForm.get('photo')?.value" [src]="memberForm.get('photo')?.value" style="width: 100%; height: 100%; object-fit: cover;">
                <span *ngIf="!memberForm.get('photo')?.value" style="font-size: 2rem; opacity: 0.5;">📸</span>
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 0.6rem; padding: 4px; text-align: center; font-weight: 700;">CHANGE</div>
              </div>
              <input #photoInput type="file" (change)="onFileChange($event)" hidden accept="image/*">
            </div>

            <div class="form-group" style="grid-column: span 1.5;">
              <label class="form-label">Full Legal Name *</label>
              <input type="text" class="form-control premium-input" formControlName="name" placeholder="E.g. Ashish Sharma">
            </div>

            <div class="form-group">
              <label class="form-label">Primary Contact *</label>
              <input type="text" class="form-control premium-input" formControlName="contactDetails" placeholder="10 Digits" maxlength="10">
            </div>

            <div class="form-group">
              <label class="form-label">Email Address (Optional)</label>
              <input type="email" class="form-control premium-input" formControlName="emailId" placeholder="ashish@example.com">
            </div>

            <div class="form-group" style="grid-column: span 1.5;">
              <label class="form-label">Residential Address *</label>
              <input type="text" class="form-control premium-input" formControlName="address" placeholder="Flat No, Street, Landmark, City">
            </div>

            <div class="form-group">
              <label class="form-label">System Role</label>
              <select class="form-control premium-input" formControlName="role">
                <option *ngFor="let role of rolesList" [value]="role.name">{{ role.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Branch/Sabha</label>
              <select class="form-control premium-input" formControlName="sabhaName">
                <option *ngFor="let s of sabhaList" [value]="s.title">{{ s.title }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Identity Setup</label>
              <select class="form-control premium-input" formControlName="status">
                <option value="Active">Active Account ✅</option>
                <option value="Inactive">Inactive Account ❌</option>
              </select>
            </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 24px; gap: 12px;">
            <button type="submit" class="btn btn-success" [disabled]="memberForm.invalid || isLoading" style="height: 52px; min-width: 200px; justify-content: center; font-size: 1rem; border-radius: var(--radius-md); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);">
              {{ editingId ? '💾 Update Profile' : '✨ Complete Enrollment' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card animate-slide-up" *ngIf="!showForm">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 20px; flex-wrap: wrap;">
        <div>
           <h2 class="card-title" style="margin-bottom: 4px;">📋 Member Registry</h2>
           <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Viewing all active and inactive members.</p>
        </div>
        <div style="position: relative; width: 100%; max-width: 320px;">
           <input type="text" class="form-control premium-input" placeholder="Search by name or mobile..." [(ngModel)]="searchQuery" style="background: var(--bg-main);">
           <span style="position: absolute; right: 14px; top: 12px; opacity: 0.5;">🔍</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px;">
                 <input type="checkbox" [checked]="isAllSelected()" (change)="toggleAll($event)">
              </th>
              <th>Personal Identity</th>
              <th>Communication</th>
              <th>Organization</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of filteredMembers" class="table-row-hover" [class.row-selected]="selectedMemberIds.has(m.id!)">
              <td>
                 <input type="checkbox" [checked]="selectedMemberIds.has(m.id!)" (change)="toggleSelection(m.id!)">
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="width: 52px; height: 52px; border-radius: 16px; background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden; font-weight: 800; color: var(--primary); font-size: 1.2rem; box-shadow: var(--shadow-sm);">
                    <img *ngIf="m.photo" [src]="m.photo" style="width: 100%; height: 100%; object-fit: cover;">
                    <span *ngIf="!m.photo">{{m.name.charAt(0) | uppercase}}</span>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--text-dark); font-size: 0.95rem; margin-bottom: 2px;">{{m.name}}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">📍 {{m.address}}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style="font-weight: 600; color: #475569; font-size: 0.9rem; margin-bottom: 2px;">📱 {{m.contactDetails}}</div>
                <div *ngIf="m.emailId" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">✉️ {{m.emailId}}</div>
              </td>
              <td>
                <span class="badge" style="background: var(--bg-sidebar-hover); color: var(--text-muted); border: 1px solid var(--border-color); margin-bottom: 4px;">{{m.role}}</span>
                <div style="font-size: 0.8rem; font-weight: 800; color: var(--primary);">🏰 {{m.sabhaName}}</div>
              </td>
              <td>
                <span class="badge" [ngClass]="m.status === 'Active' ? 'badge-active' : 'badge-inactive'">
                  {{ (m.status === 'Active' ? '🟢 ' : '🔴 ') + m.status }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button class="btn" style="padding: 10px; background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-md);" (click)="editMember(m)">✏️</button>
                  <button class="btn" style="padding: 10px; background: rgba(225, 29, 72, 0.05); border: 1px solid rgba(225, 29, 72, 0.1); color: var(--danger); border-radius: var(--radius-md);" (click)="deleteMember(m.id)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredMembers.length === 0 && !isLoading">
               <td colspan="6" style="text-align: center; padding: 80px; background: #fafafa; border-radius: 0 0 20px 20px;">
                  <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.2;">🗂️</div>
                  <div style="font-weight: 800; font-size: 1.1rem; color: #64748b; margin-bottom: 4px;">No Members Found</div>
                  <div style="font-size: 0.9rem; color: #94a3b8;">Try a different search term or add a new record.</div>
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions Bar -->
      <div *ngIf="selectedMemberIds.size > 0" class="bulk-action-bar animate-fade-in">
         <div style="display: flex; align-items: center; gap: 20px;">
            <div style="font-weight: 800; font-size: 1rem; color: white;">⚡ {{ selectedMemberIds.size }} items selected</div>
            <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.2);"></div>
            <div style="display: flex; gap: 12px;">
               <button (click)="bulkUpdateStatus('Active')" class="btn" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem;">Mark Active</button>
               <button (click)="bulkUpdateStatus('Inactive')" class="btn" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem;">Mark Inactive</button>
               <button (click)="bulkDelete()" class="btn" style="background: rgba(239, 68, 68, 0.4); color: white; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 0.85rem;">Delete Permanent</button>
            </div>
         </div>
         <button (click)="selectedMemberIds.clear()" class="btn" style="color: white; font-weight: 600; font-size: 0.85rem;">Dismiss</button>
      </div>
    </div>
  `
})
export class MemberManagementComponent implements OnInit {
  selectedMemberIds: Set<string> = new Set();
  supabaseService = inject(SupabaseService);
  fb = inject(FormBuilder);
  
  members: Member[] = [];
  rolesList: any[] = [];
  sabhaList: any[] = [];
  showForm = false;
  editingId: string | null = null;
  searchQuery: string = '';
  isLoading = false;

  get filteredMembers() {
    if (!this.searchQuery.trim()) return this.members;
    const query = this.searchQuery.toLowerCase();
    return this.members.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.contactDetails.includes(query) ||
      (m.emailId && m.emailId.toLowerCase().includes(query))
    );
  }

  memberForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    contactDetails: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    emailId: [''],
    photo: [''],
    address: ['', Validators.required],
    role: ['Regular Member', Validators.required],
    sabhaName: ['', Validators.required],
    status: ['Active', Validators.required]
  });

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadRoles(),
        this.loadSabhaDropdown(),
        this.loadMembers()
      ]);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMembers() {
    try {
      const data = await this.supabaseService.getMembers();
      this.members = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        contactDetails: item.contact_details,
        emailId: item.email_id,
        photo: item.photo,
        address: item.address,
        role: item.role,
        sabhaName: item.sabha_name,
        joiningDate: item.joining_date,
        status: item.status,
        walletBalance: item.wallet_balance
      }));
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  async loadRoles() {
    try {
      this.rolesList = await this.supabaseService.getRoles();
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }

  async loadSabhaDropdown() {
    try {
      this.sabhaList = await this.supabaseService.getSabhas();
      if (this.sabhaList.length > 0 && !this.memberForm.get('sabhaName')?.value) {
        this.memberForm.patchValue({ sabhaName: this.sabhaList[0].title });
      }
    } catch (error) {
      console.error('Error loading sabhas:', error);
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.memberForm.reset({role: 'Regular Member', status: 'Active'});
    this.editingId = null;
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.memberForm.patchValue({ photo: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  editMember(m: Member) {
    this.showForm = true;
    this.editingId = m.id;
    this.memberForm.patchValue({
      name: m.name,
      contactDetails: m.contactDetails,
      emailId: m.emailId,
      photo: m.photo,
      address: m.address,
      role: m.role,
      sabhaName: m.sabhaName,
      status: m.status
    });
  }

  async deleteMember(id: string) {
    if(confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      const { error } = await this.supabaseService.client.from('members').delete().eq('id', id);
      if (!error) {
        this.members = this.members.filter(m => m.id !== id);
      } else {
        alert('Error deleting member: ' + error.message);
      }
    }
  }

  async onSubmit() {
    if (this.memberForm.valid) {
      this.isLoading = true;
      try {
        const formValue = this.memberForm.value;
        const dbPayload = {
          name: formValue.name,
          contact_details: formValue.contactDetails,
          email_id: formValue.emailId,
          photo: formValue.photo,
          address: formValue.address,
          role: formValue.role,
          sabha_name: formValue.sabhaName,
          status: formValue.status
        };

        let result;
        if (this.editingId) {
          result = await this.supabaseService.client.from('members').update(dbPayload).eq('id', this.editingId);
        } else {
          result = await this.supabaseService.client.from('members').insert([dbPayload]);
        }
        
        if (result && result.error) {
          alert('Failed to save to database: ' + result.error.message);
          return;
        }

        await this.loadMembers();
        this.toggleForm();
      } catch (err) {
        console.error(err);
        alert('Unexpected error occurred while saving.');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.memberForm.markAllAsTouched();
    }
  }

  toggleSelection(id: string) {
    if (this.selectedMemberIds.has(id)) {
      this.selectedMemberIds.delete(id);
    } else {
      this.selectedMemberIds.add(id);
    }
  }

  isAllSelected() {
    return this.filteredMembers.length > 0 && this.selectedMemberIds.size === this.filteredMembers.length;
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.filteredMembers.forEach(m => this.selectedMemberIds.add(m.id!));
    } else {
      this.selectedMemberIds.clear();
    }
  }

  async bulkUpdateStatus(status: 'Active' | 'Inactive') {
    if (this.selectedMemberIds.size === 0) return;
    this.isLoading = true;
    try {
      const ids = Array.from(this.selectedMemberIds);
      const { error } = await this.supabaseService.client.from('members').update({ status }).in('id', ids);
      if (error) throw error;
      alert(`Bulk update successful: ${ids.length} members marked as ${status}`);
      this.selectedMemberIds.clear();
      await this.loadMembers();
    } catch (e) {
      console.error(e);
      alert('Bulk update failed.');
    } finally {
      this.isLoading = false;
    }
  }

  async bulkDelete() {
    if (this.selectedMemberIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${this.selectedMemberIds.size} records?`)) return;
    
    this.isLoading = true;
    try {
      const ids = Array.from(this.selectedMemberIds);
      const { error } = await this.supabaseService.client.from('members').delete().in('id', ids);
      if (error) throw error;
      alert(`${ids.length} records deleted.`);
      this.selectedMemberIds.clear();
      await this.loadMembers();
    } catch (e) {
      console.error(e);
      alert('Deletion failed.');
    } finally {
      this.isLoading = false;
    }
  }
}
