import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
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
        <button *ngIf="isAdmin" class="btn" [ngClass]="showForm ? 'btn-danger' : 'btn-primary'" (click)="toggleForm()" style="justify-content: center;">
          {{ showForm ? '✕ Close Portal' : '+ New Registration' }}
        </button>
      </div>

      <!-- Registration Form Area -->
      <div *ngIf="showForm" style="margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="memberForm" (ngSubmit)="onSubmit()">
          <!-- Photo & Basic Identity -->
          <div class="responsive-grid" style="grid-template-columns: 120px 1fr 1.5fr 1.5fr; gap: 24px; margin-bottom: 32px;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div (click)="photoInput.click()" style="width: 120px; height: 120px; border-radius: 12px; background: var(--bg-main); border: 2px dashed var(--border-color); display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; margin: 0 auto; position: relative;">
                <img *ngIf="memberForm.get('photo')?.value" [src]="memberForm.get('photo')?.value" style="width: 100%; height: 100%; object-fit: cover;">
                <div *ngIf="!memberForm.get('photo')?.value" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <span style="font-size: 2rem; opacity: 0.3;">🖼️</span>
                  <span style="font-size: 0.6rem; font-weight: 800; color: #ef4444;">REQUIRED *</span>
                </div>
                <input #photoInput type="file" (change)="onFileChange($event)" hidden accept="image/*">
              </div>
              <button type="button" class="btn" (click)="startCamera()" style="font-size: 0.75rem; padding: 8px; width: 100%; background: var(--primary-soft); color: var(--primary); border: 1px solid rgba(248, 121, 65, 0.2); border-radius: 8px;">
                📸 Use Camera
              </button>
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
              <div class="form-group" style="margin:0;">
                <label class="form-label">Date of Birth *</label>
                <input type="date" class="form-control" formControlName="dob">
                <div *ngIf="memberForm.get('dob')?.touched && memberForm.get('dob')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">DOB is required</div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="form-group" style="margin:0;">
                <label class="form-label">Email Address *</label>
                <input type="email" class="form-control" formControlName="emailId" placeholder="ashish@example.com">
                <div *ngIf="memberForm.get('emailId')?.touched && memberForm.get('emailId')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Valid email is required</div>
              </div>
              <div class="form-group" style="margin:0;">
                <label class="form-label">Login Password *</label>
                <input type="password" class="form-control" formControlName="password" placeholder="Min 6 characters">
                <div *ngIf="memberForm.get('password')?.touched && memberForm.get('password')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Password is required</div>
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="form-group" style="margin:0;">
                <label class="form-label">System Role *</label>
                <select class="form-control" formControlName="role">
                  <option *ngFor="let role of rolesList" [value]="role.name">{{ role.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Branch/Sabha *</label>
                <select class="form-control" formControlName="sabhaName">
                  <option *ngFor="let s of sabhaList" [value]="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Extended Information -->
          <div class="responsive-grid" style="grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 32px;">
             <div class="form-group" style="margin:0;">
                <label class="form-label">Residential Address *</label>
                <input type="text" class="form-control" formControlName="address" placeholder="Full address details">
                <div *ngIf="memberForm.get('address')?.touched && memberForm.get('address')?.invalid" style="color: #ef4444; font-size: 0.7rem; margin-top: 4px;">Address is required</div>
             </div>
             <div class="form-group" style="margin:0;">
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
                <th *ngIf="isAdmin" style="width: 40px;"><input type="checkbox" [checked]="isAllSelected()" (change)="toggleAll($event)"></th>
                <th>Member Profile</th>
                <th>Contact Details</th>
                <th>Affiliation</th>
                <th>Account Status</th>
                <th style="text-align: right;">Operations</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of filteredMembers" class="table-row-hover">
                <td *ngIf="isAdmin"><input type="checkbox" [checked]="selectedMemberIds.has(m.id!)" (change)="toggleSelection(m.id!)"></td>
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
                  <button class="btn" style="padding: 8px; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.85rem;" (click)="editMember(m)">Edit Profile</button>
                  <button *ngIf="isAdmin" class="btn" style="padding: 8px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); color: var(--danger); font-size: 0.85rem; margin-left: 8px;" (click)="deleteMember(m.id!)">Delete</button>
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
               <button class="btn" style="flex: 1; justify-content: center; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark);" (click)="editMember(m)">Edit Profile</button>
               <button *ngIf="isAdmin" class="btn btn-danger" style="flex: 1; justify-content: center;" (click)="deleteMember(m.id!)">Delete</button>
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

      <!-- Camera Overlay for Member Photo Capture -->
      <div *ngIf="isScanning" class="camera-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px);">
        <div class="camera-container" style="position: relative; width: 85%; max-width: 380px; aspect-ratio: 3/4; border-radius: 40px; overflow: hidden; border: 2px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <video #videoElement autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
          
          <!-- Modern Face Guide -->
          <div class="face-guide">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>

          <!-- Status Overlay -->
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%); pointer-events: none;"></div>

          <div style="position: absolute; top: 30px; left: 0; width: 100%; text-align: center; color: white; z-index: 20;">
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.7; margin-bottom: 8px; font-weight: 800;">Profile Registration</div>
            <div style="font-size: 1.1rem; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">{{ scanStatus || 'Ready to Capture' }}</div>
          </div>
          
          <!-- Capture Button -->
          <div style="position: absolute; bottom: 40px; width: 100%; display: flex; justify-content: center; z-index: 30;">
            <button class="capture-trigger" (click)="capturePhoto()" aria-label="Take Photo">
              <div class="inner-circle"></div>
            </button>
          </div>
        </div>
        <button class="btn" (click)="stopCamera()" style="margin-top: 40px; background: rgba(255,255,255,0.05); color: white; border-radius: 50px; padding: 14px 40px; font-weight: 800; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);">CANCEL</button>
      </div>

    </div>

  `,
  styles: [`
    .camera-overlay {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .face-guide {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      height: 60%;
      pointer-events: none;
      z-index: 10;
    }
    .corner {
      position: absolute;
      width: 30px;
      height: 30px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }
    .top-left { top: 0; left: 0; border-right: 0; border-bottom: 0; border-radius: 12px 0 0 0; }
    .top-right { top: 0; right: 0; border-left: 0; border-bottom: 0; border-radius: 0 12px 0 0; }
    .bottom-left { bottom: 0; left: 0; border-right: 0; border-top: 0; border-radius: 0 0 0 12px; }
    .bottom-right { bottom: 0; right: 0; border-left: 0; border-top: 0; border-radius: 0 0 12px 0; }
    
    .capture-trigger {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: white;
      border: none;
      padding: 6px;
      cursor: pointer;
      box-shadow: 0 0 25px rgba(255,255,255,0.2);
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .capture-trigger:active {
      transform: scale(0.9);
    }
    .inner-circle {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid black;
      background: white;
    }
    @keyframes fadeIn {
      from { opacity: 0; backdrop-filter: blur(0px); }
      to { opacity: 1; backdrop-filter: blur(15px); }
    }
    .badge-active { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .badge-inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
  `]
})
export class MemberManagementComponent implements OnInit {
  selectedMemberIds: Set<string> = new Set();
  supabaseService = inject(SupabaseService);
  auth = inject(AuthService);
  fb = inject(FormBuilder);
  
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  members: Member[] = [];
  rolesList: any[] = [];
  sabhaList: string[] = ['Yuva Sabha', 'Bal Sabha', 'Sanyukt sabha', 'Yuvti Sabha', 'Balika Sabha'];
  showForm = false;
  editingId: string | null = null;
  searchQuery: string = '';
  isLoading = false;

  // Camera state
  isScanning = false;
  scanStatus = '';
  private stream: MediaStream | null = null;

  get isAdmin() {
    const role = this.auth.userRole?.trim() || '';
    return role === 'Admin' || role.includes('Admin') || role.includes('Sanchalak');
  }

  get filteredMembers() {
    // Exclude 'Organization/Activity' from the human member registry view
    let list = this.members.filter(m => m.role !== 'Organization/Activity');
    
    // Only show profile for regular members if they lack global view/edit permissions
    const currentUser = this.auth.currentUserValue;
    if (!this.isAdmin) {
      list = list.filter(m => m.id === currentUser?.id || m.emailId === currentUser?.email);
    }

    if (!this.searchQuery.trim()) return list;
    const query = this.searchQuery.toLowerCase();
    return list.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.contactDetails.includes(query) ||
      (m.emailId && m.emailId.toLowerCase().includes(query))
    );
  }

  memberForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    contactDetails: ['', [Validators.required, Validators.pattern('^[0-9]{7,15}$')]],
    emailId: ['', [Validators.required, Validators.email]],
    dob: ['', Validators.required],
    photo: ['', Validators.required],
    address: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Regular Member', Validators.required],
    sabhaName: ['Yuva Sabha', Validators.required],
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
        dob: item.dob,
        status: item.status,
        walletBalance: item.wallet_balance,
        password: item.password
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


  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.memberForm.reset({role: 'Regular Member', status: 'Active', sabhaName: 'Yuva Sabha'});
    this.editingId = null;
  }

  async onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        this.memberForm.patchValue({ photo: e.target.result });
        this.isLoading = false;
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
      status: m.status,
      password: m.password,
      dob: m.dob
    });
  }

  async deleteMember(id: string) {
    if(confirm('Are you sure you want to delete this member? This will also remove all their attendance and financial history. This action cannot be undone.')) {
      this.isLoading = true;
      try {
        // 1. Clean up related attendance records
        const { error: attError } = await this.supabaseService.client
          .from('attendance')
          .delete()
          .eq('member_id', id);
        
        if (attError) throw new Error('Failed to clean attendance: ' + attError.message);

        // 2. Clean up related wallet transactions
        const { error: txError } = await this.supabaseService.client
          .from('wallet_transactions')
          .delete()
          .eq('member_id', id);

        if (txError) throw new Error('Failed to clean transactions: ' + txError.message);

        // 3. Finally delete the member
        const { error: memError } = await this.supabaseService.client
          .from('members')
          .delete()
          .eq('id', id);

        if (memError) throw memError;

        this.members = this.members.filter(m => m.id !== id);
        alert('Member and all related history removed successfully! 🧹');
      } catch (error: any) {
        console.error('Delete Error:', error);
        alert('Error deleting member: ' + error.message);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onSubmit() {
    if (this.memberForm.valid) {
      this.isLoading = true;
      try {
        const formValue = this.memberForm.value;
        let photoUrl = formValue.photo;

        // Optimized Storage Flow: If photo is base64, upload to storage bucket
        if (photoUrl && photoUrl.includes('base64')) {
          const uploadResult = await this.supabaseService.uploadMemberPhoto(photoUrl);
          if (uploadResult.publicUrl) {
            photoUrl = uploadResult.publicUrl;
          }
        }

        const dbPayload = {
          name: formValue.name,
          contact_details: formValue.contactDetails,
          email_id: formValue.emailId,
          photo: photoUrl,
          address: formValue.address,
          role: formValue.role,
          sabha_name: formValue.sabhaName,
          status: formValue.status,
          password: formValue.password,
          dob: formValue.dob
        };

        let result;
        if (this.editingId) {
          result = await this.supabaseService.updateMember(this.editingId, dbPayload);
        } else {
          result = await this.supabaseService.addMember(dbPayload);
        }
        
        if (result && result.error) {
          if (result.error.message.includes('members_role_check')) {
            alert('❌ Database Error: The selected role is not allowed by the database constraint. Please run the SQL fix provided in the report to enable dynamic roles.');
          } else {
            alert('Failed to save to database: ' + result.error.message);
          }
          return;
        }

        alert(this.editingId ? 'Member record updated successfully! ✨' : 'New member registered successfully! ✨');
        await this.loadMembers();
        this.toggleForm();
      } catch (err: any) {
        console.error(err);
        alert('Unexpected error occurred: ' + (err.message || 'Check console for details.'));
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
    if (!confirm(`Are you sure you want to delete ${this.selectedMemberIds.size} records and all their associated history?`)) return;
    
    this.isLoading = true;
    try {
      const ids = Array.from(this.selectedMemberIds);
      
      // 1. Bulk clean attendance
      await this.supabaseService.client.from('attendance').delete().in('member_id', ids);
      
      // 2. Bulk clean transactions
      await this.supabaseService.client.from('wallet_transactions').delete().in('member_id', ids);

      // 3. Delete members
      const { error } = await this.supabaseService.client.from('members').delete().in('id', ids);
      
      if (error) throw error;
      
      alert(`${ids.length} records and their histories deleted successfully! 🧹`);
      this.selectedMemberIds.clear();
      await this.loadMembers();
    } catch (e) {
      console.error(e);
      alert('Bulk deletion failed.');
    } finally {
      this.isLoading = false;
    }
  }

  // Camera Methods
  async startCamera() {
    this.isScanning = true;
    this.scanStatus = 'Accessing Camera...';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.scanStatus = 'Ready to Capture';
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera.');
      this.stopCamera();
    }
  }

  stopCamera() {
    this.isScanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async capturePhoto() {
    if (!this.videoElement || !this.isScanning) return;
    
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw flipped for the final photo if desired
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    this.memberForm.patchValue({ photo: base64 });
    this.stopCamera();
  }
}
