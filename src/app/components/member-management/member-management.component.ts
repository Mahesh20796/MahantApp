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
    <div class="card animate-fade-in" style="margin-bottom: 32px;">
      <div class="page-header">
        <div>
          <h2 class="card-title" style="margin: 0;">👥 Member Registry</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Search, register, and manage organization members.</p>
        </div>
        <button class="btn" [ngClass]="showForm ? 'btn-danger' : 'btn-primary'" (click)="toggleForm()" style="justify-content: center;">
          {{ showForm ? '✕ Close Portal' : '+ New Registration' }}
        </button>
      </div>

      <!-- Registration Form Area -->
      <div *ngIf="showForm" style="margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="memberForm" (ngSubmit)="onSubmit()">
          <!-- Photo & Basic Identity -->
          <div class="responsive-grid" style="grid-template-columns: 120px 1fr 1fr; gap: 32px; margin-bottom: 32px;">
            <div (click)="photoInput.click()" style="width: 120px; height: 120px; border-radius: 12px; background: var(--bg-main); border: 2px dashed var(--border-color); display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; margin: 0 auto;">
              <img *ngIf="memberForm.get('photo')?.value" [src]="memberForm.get('photo')?.value" style="width: 100%; height: 100%; object-fit: cover;">
              <div *ngIf="!memberForm.get('photo')?.value" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <span style="font-size: 2rem; opacity: 0.3;">📸</span>
                <span style="font-size: 0.6rem; font-weight: 800; color: #ef4444;">REQUIRED *</span>
              </div>
              <input #photoInput type="file" (change)="onFileChange($event)" hidden accept="image/*">
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="form-group" style="margin:0;">
                <label class="form-label">Full Legal Name *</label>
                <input type="text" class="form-control" formControlName="name" placeholder="E.g. Ashish Sharma">
                <div *ngIf="memberForm.get('name')?.touched && memberForm.get('name')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Name is required</div>
              </div>
              <div class="form-group" style="margin:0;">
                <label class="form-label">Primary Contact *</label>
                <input type="text" class="form-control" formControlName="contactDetails" placeholder="7-15 Digits">
                <div *ngIf="memberForm.get('contactDetails')?.touched && memberForm.get('contactDetails')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Valid 7-15 digit number required</div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="form-group" style="margin:0;">
                <label class="form-label">Email Address *</label>
                <input type="email" class="form-control" formControlName="emailId" placeholder="ashish@example.com">
                <div *ngIf="memberForm.get('emailId')?.touched && memberForm.get('emailId')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Valid email is required</div>
              </div>
              <div class="form-group" style="margin:0;">
                <label class="form-label">System Role *</label>
                <select class="form-control" formControlName="role">
                  <option *ngFor="let role of rolesList" [value]="role.name">{{ role.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Extended Information -->
          <div class="responsive-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 32px;">
             <div class="form-group">
                <label class="form-label">Residential Address *</label>
                <input type="text" class="form-control" formControlName="address" placeholder="Full address details">
                <div *ngIf="memberForm.get('address')?.touched && memberForm.get('address')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Address is required</div>
             </div>
             <div class="form-group">
                <label class="form-label">Branch/Sabha *</label>
                <select class="form-control" formControlName="sabhaName">
                  <option *ngFor="let s of sabhaList" [value]="s.title">{{ s.title }}</option>
                </select>
             </div>
             <div class="form-group">
                <label class="form-label">Account Status *</label>
                <select class="form-control" formControlName="status">
                  <option value="Active">Active Account</option>
                  <option value="Inactive">Inactive Account</option>
                </select>
             </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 24px;">
            <button type="button" class="btn" (click)="toggleForm()" style="background: var(--bg-main); color: var(--text-dark);">Discard</button>
            <button type="submit" class="btn btn-primary" [disabled]="isLoading" style="min-width: 140px; justify-content: center;">
              {{ (isLoading) ? 'Processing...' : (editingId ? 'Update Record' : 'Create Registry Item') }}
            </button>
          </div>
          <div *ngIf="memberForm.invalid && memberForm.touched" style="text-align: right; color: #ef4444; font-size: 0.75rem; margin-top: 12px; font-weight: 600;">
             Please complete all required fields with valid data.
          </div>
        </form>
      </div>

      <!-- Data Search & List Overlay -->
      <div *ngIf="!showForm" style="margin-top: 32px;">
        <div style="margin-bottom: 24px;">
           <div style="position: relative; width: 100%; max-width: 400px;">
              <input type="text" class="form-control" placeholder="Search by name or mobile..." [(ngModel)]="searchQuery" style="padding-left: 40px; background: var(--bg-main);">
              <span style="position: absolute; left: 14px; top: 12px; opacity: 0.3;">🔍</span>
           </div>
        </div>

        <div class="table-responsive hide-on-mobile">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px;"><input type="checkbox" [checked]="isAllSelected()" (change)="toggleAll($event)"></th>
                <th>Member Profile</th>
                <th>Contact Details</th>
                <th>Affiliation</th>
                <th>Account Status</th>
                <th style="text-align: right;">Operations</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of filteredMembers" class="table-row-hover">
                <td><input type="checkbox" [checked]="selectedMemberIds.has(m.id!)" (change)="toggleSelection(m.id!)"></td>
                <td>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--bg-main); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden; font-weight: 700; font-size: 0.9rem;">
                      <img *ngIf="m.photo" [src]="m.photo" style="width: 100%; height: 100%; object-fit: cover;">
                      <span *ngIf="!m.photo" style="color: var(--primary);">{{m.name.charAt(0) | uppercase}}</span>
                    </div>
                    <div>
                      <div style="font-weight: 700; color: var(--text-dark);">{{m.name}}</div>
                      <div style="font-size: 0.7rem; color: var(--text-muted);">{{m.address}}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; font-size: 0.85rem;">{{m.contactDetails}}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">{{m.emailId || 'No Email'}}</div>
                </td>
                <td>
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px;">{{m.role}}</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--primary);">🏰 {{m.sabhaName}}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="m.status === 'Active' ? 'badge-active' : 'badge-inactive'">
                     {{ m.status }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button class="btn" style="padding: 8px; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.85rem;" (click)="editMember(m)">Edit</button>
                  <button class="btn" style="padding: 8px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); color: var(--danger); font-size: 0.85rem; margin-left: 8px;" (click)="deleteMember(m.id!)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Skeleton Loader for List -->
        <div *ngIf="isLoading && members.length === 0" style="padding: 20px;">
          <div *ngFor="let i of [1,2,3,4]" class="skeleton" style="height: 64px; margin-bottom: 12px; border-radius: 8px;"></div>
        </div>

        <!-- Mobile View (Institutional Cards) -->
        <div class="show-on-mobile mobile-card-list">
          <div *ngFor="let m of filteredMembers" class="mobile-card">
            <div class="mobile-card-header">
              <div style="display: flex; gap: 12px; align-items: center;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--bg-main); display:flex; align-items:center; justify-content:center; overflow:hidden; border: 1px solid var(--border-color);">
                    <img *ngIf="m.photo" [src]="m.photo" style="width: 100%; height: 100%; object-fit: cover;">
                    <span *ngIf="!m.photo" style="font-weight: 700; color: var(--primary);">{{ m.name.charAt(0) }}</span>
                </div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-dark);">{{ m.name }}</div>
              </div>
              <span class="badge" [ngClass]="m.status === 'Active' ? 'badge-active' : 'badge-inactive'">{{ m.status }}</span>
            </div>
            <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px; color: var(--text-muted); font-weight: 500;">
               <div>📱 {{ m.contactDetails }}</div>
               <div>🏰 {{ m.sabhaName }}</div>
            </div>
            <div style="margin-top: 16px; pt-16; border-top: 1px solid var(--border-color); display: flex; gap: 12px; padding-top: 16px;">
               <button class="btn" style="flex: 1; justify-content: center; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark);" (click)="editMember(m)">Edit</button>
               <button class="btn btn-danger" style="flex: 1; justify-content: center;" (click)="deleteMember(m.id!)">Delete</button>
            </div>
          </div>
        </div>

        <div *ngIf="filteredMembers.length === 0 && !isLoading" style="text-align: center; padding: 64px 0; opacity: 0.5;">
          <div style="font-size: 3rem; margin-bottom: 12px;">📂</div>
          <div style="font-weight: 700;">No Registry Matches Found</div>
        </div>
      </div>

      <!-- Bulk Actions Footbar -->
      <div *ngIf="selectedMemberIds.size > 0" class="animate-slide-up" style="position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--bg-sidebar); padding: 12px 24px; border-radius: 99px; display: flex; align-items: center; gap: 24px; z-index: 1000; box-shadow: var(--shadow-md); color: white;">
          <div style="font-weight: 700;">{{ selectedMemberIds.size }} items selected</div>
          <div style="display: flex; gap: 8px;">
            <button (click)="bulkUpdateStatus('Active')" class="btn" style="background: rgba(255,255,255,0.1); color: white; padding: 6px 12px; font-size: 0.75rem;">Mark Active</button>
            <button (click)="bulkUpdateStatus('Inactive')" class="btn" style="background: rgba(255,255,255,0.1); color: white; padding: 6px 12px; font-size: 0.75rem;">Mark Inactive</button>
            <button (click)="bulkDelete()" class="btn" style="background: var(--danger); color: white; padding: 6px 12px; font-size: 0.75rem;">Delete</button>
          </div>
          <button (click)="selectedMemberIds.clear()" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.2rem; padding: 0 8px;">✕</button>
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
    contactDetails: ['', [Validators.required, Validators.pattern('^[0-9]{7,15}$')]],
    emailId: ['', [Validators.required, Validators.email]],
    photo: ['', Validators.required],
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
    this.editingId = m.id || null;
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

        alert(this.editingId ? 'Member record updated successfully! ✨' : 'New member registered successfully! ✨');
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
