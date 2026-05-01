import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Sabha } from '../../models/sabha.model';


@Component({
  selector: 'app-sabha-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card animate-fade-in" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="card-title" style="margin-bottom: 4px;">🗓️ Sabha History & Records</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">Comprehensive history of meetings, member roles, and registry status.</p>
        </div>
        <button class="btn" (click)="toggleForm()" 
                [style.background]="showForm ? '#fee2e2' : 'var(--primary)'" 
                [style.color]="showForm ? '#ef4444' : 'white'" 
                [style.border]="showForm ? '1px solid #fecaca' : 'none'"
                style="height: 44px; border-radius: 12px; font-weight: 700; padding: 0 20px; transition: all 0.3s;">
          {{ showForm ? '✕ Close Form' : '+ New Schedule' }}
        </button>
      </div>

      <!-- Tab Switcher -->
      <div style="display: flex; gap: 8px; margin-top: 28px; background: var(--bg-sidebar); padding: 6px; border-radius: var(--radius-lg); width: fit-content; border: 1px solid var(--border-color);">
        <button class="btn" style="background: var(--primary); color: white; box-shadow: var(--shadow-md); padding: 10px 20px; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 700;">
          🗓️ Sabha Schedules
        </button>
      </div>
      
      <div *ngIf="showForm" style="margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="sabhaForm" (ngSubmit)="onSubmit()">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; align-items: flex-end;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; color: var(--text-muted);">Sabha Title *</label>
              <select class="form-control premium-input" formControlName="title">
                <option value="Yuva Sabha">Yuva Sabha</option>
                <option value="Bal Sabha">Bal Sabha</option>
                <option value="Sanyukt sabha">Sanyukt sabha</option>
                <option value="Yuvti Sabha">Yuvti Sabha</option>
                <option value="Balika Sabha">Balika Sabha</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; color: var(--text-muted);">Sabha Category *</label>
              <select class="form-control premium-input" formControlName="sabhaType">
                <option value="Weekly Sabha">Weekly Meeting</option>
                <option value="Special Sabha">Special Event</option>
                <option value="Annual Sabha">Annual Gathering</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; color: var(--text-muted);">Sabha Date *</label>
              <input type="date" lang="en-IN" class="form-control premium-input" formControlName="sabhaDate">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; color: var(--text-muted);">Meeting Start Time *</label>
              <input type="time" class="form-control premium-input" formControlName="timeSchedule">
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" class="btn" [disabled]="sabhaForm.invalid || loading" 
                      style="height: 52px; border-radius: 14px; min-width: 180px; font-size: 1rem; justify-content: center; background: #10b981; color: white; font-weight: 800; border: none; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                ✨ {{ loading ? 'Saving...' : (editingId ? 'Update Meeting' : 'Create & Schedule') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="card animate-slide-up" *ngIf="!showForm && currentTab === 'schedules'" style="border: 1px solid #262626;">
      <div class="table-responsive hide-on-mobile">
        <table class="table">
          <thead>
            <tr>
              <th>Meeting Identity</th>
              <th>Category</th>
              <th>Meeting Date</th>
              <th>Time Slot</th>
              <th>Attendance Stats</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sabhas" class="table-row-hover">
              <td>
                <div style="font-weight: 700; color: var(--text-dark); font-size: 1rem;">{{s.title}}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ID: #{{s.id.substring(0,8)}}</div>
              </td>
              <td>
                <span class="badge" 
                  [style.background]="s.sabhaType === 'Special Sabha' ? '#fff7ed' : (s.sabhaType === 'Annual Sabha' ? '#f5f3ff' : '#eff6ff')"
                  [style.color]="s.sabhaType === 'Special Sabha' ? '#9a3412' : (s.sabhaType === 'Annual Sabha' ? '#5b21b6' : '#2563eb')"
                  [style.border]="s.sabhaType === 'Special Sabha' ? '1px solid #fed7aa' : (s.sabhaType === 'Annual Sabha' ? '1px solid #ddd6fe' : '1px solid #bfdbfe')">
                  {{s.sabhaType}}
                </span>
              </td>
              <td>
                <div style="font-weight: 600; color: var(--text-dark);">
                  {{ s.sabhaDate ? (s.sabhaDate | date:'dd/MM/yyyy') : 'Unscheduled' }}
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                   <div style="width: 36px; height: 36px; background: var(--primary-soft); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary);">🕒</div>
                   <span style="font-weight: 700; color: var(--text-dark); font-size: 0.95rem;">{{s.timeSchedule}}</span>
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" (click)="showParticipants(s)">
                    <div style="padding: 6px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <span style="font-weight: 800; color: #10b981; font-size: 0.9rem;">✅ {{s.presentCount}} Present</span>
                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">out of {{s.assignedMembers.length}}</span>
                    </div>
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button class="btn" style="padding: 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-md);" (click)="editSabha(s)">✏️</button>
                  <button class="btn" style="padding: 10px; background: rgba(225, 29, 72, 0.05); border: 1px solid rgba(225, 29, 72, 0.1); color: var(--danger); border-radius: var(--radius-md);" (click)="deleteSabha(s.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile View -->
      <div class="show-on-mobile mobile-card-list">
        <div *ngFor="let s of sabhas" class="card" style="padding: 20px; border: 1px solid #262626;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <div style="font-weight: 700; color: var(--text-dark); font-size: 1rem;">{{s.title}}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">📅 {{ s.sabhaDate ? (s.sabhaDate | date:'dd/MM/yyyy') : 'Unscheduled' }} • 🕒 {{s.timeSchedule}}</div>
            </div>
            <span class="badge">{{s.sabhaType}}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div (click)="showParticipants(s)" style="color: var(--primary); font-size: 0.8rem; font-weight: 700; cursor: pointer;">
              📊 {{s.presentCount}} / {{s.assignedMembers.length}} Attended
            </div>
            <div style="display: flex; gap: 8px;">
               <button class="btn" style="padding: 8px; background: var(--bg-sidebar); border: 1px solid var(--border-color); color: var(--text-muted);" (click)="editSabha(s)">✏️</button>
               <button class="btn" style="padding: 8px; background: rgba(225, 29, 72, 0.05); border: 1px solid rgba(225, 29, 72, 0.1); color: var(--danger);" (click)="deleteSabha(s.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Participants Modal -->
    <div *ngIf="isModalOpen" class="modal-overlay animate-fade-in" (click)="closeModal()">
      <div class="modal-content glass-card animate-slide-up" (click)="$event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem; color: #FFFFFF;">👥 Participants List</h3>
            <p style="margin: 4px 0 0; font-size: 0.85rem; color: #B1B1B1;">Assigned members for <b>{{selectedSabha?.title}}</b></p>
          </div>
          <button class="btn" (click)="closeModal()" style="padding: 8px; background: var(--bg-sidebar); border-radius: 50%; width: 36px; height: 36px; color: white;">✕</button>
        </div>

        <div style="max-height: 400px; overflow-y: auto;">
          <div *ngIf="selectedSabha?.assignedMembers?.length === 0" style="text-align: center; padding: 40px; color: var(--text-muted);">
             <div style="font-size: 2.5rem; margin-bottom: 12px;">🤷‍♂️</div>
             No members assigned to this sabha.
          </div>
          
          <div *ngFor="let m of selectedSabha?.assignedMembers" style="display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: var(--radius-md); background: rgba(255,255,255,0.02); margin-bottom: 8px; border: 1px solid var(--border-color);">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; border: 1px solid rgba(248, 121, 65, 0.2);">
               {{ m.name.charAt(0) }}
            </div>
            <div style="flex: 1;">
               <div style="display: flex; justify-content: space-between; align-items: center;">
                 <div style="font-weight: 700; font-size: 0.95rem; color: #FFFFFF;">{{ m.name }}</div>
                 <span class="badge" 
                       [style.background]="m.attendanceStatus === 'P' ? 'rgba(16, 185, 129, 0.15)' : (m.attendanceStatus === 'A' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')"
                       [style.color]="m.attendanceStatus === 'P' ? '#10b981' : (m.attendanceStatus === 'A' ? '#ef4444' : '#f59e0b')"
                       style="font-size: 0.65rem; border-radius: 6px; padding: 4px 8px;">
                   {{ m.attendanceStatus === 'P' ? 'Present' : m.attendanceStatus === 'A' ? 'Absent' : m.attendanceStatus === 'L' ? 'Leave' : 'Unmarked' }}
                 </span>
               </div>
               <div style="font-size: 0.75rem; color: #B1B1B1; font-weight: 600;">👑 {{ m.role }} • 📱 {{ m.contact_details }}</div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 24px; text-align: right;">
           <button class="btn btn-primary" (click)="closeModal()" style="padding: 10px 24px;">Close View</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 24px;
    }
    .modal-content {
      width: 100%; max-width: 500px;
      padding: 32px;
      background: var(--bg-sidebar);
      border: 1px solid var(--border-color);
      color: white;
    }
  `]
})
export class SabhaManagementComponent implements OnInit {
  supabaseService = inject(SupabaseService);
  fb = inject(FormBuilder);
  
  sabhas: any[] = [];
  showForm = false;
  editingId: string | null = null;
  currentTab: 'schedules' | 'members' | 'roles' = 'schedules';
  loading = false;

  // Modal State
  isModalOpen = false;
  selectedSabha: any = null;

  sabhaForm: FormGroup = this.fb.group({
    title: ['Yuva Sabha', Validators.required],
    sabhaType: ['Weekly Sabha', Validators.required],
    sabhaDate: [new Date().toISOString().split('T')[0], Validators.required],
    timeSchedule: ['', Validators.required]
  });

  ngOnInit() {
    this.loadSabhas();
  }

  async loadSabhas() {
    try {
      const sabhaData = await this.supabaseService.getSabhas();
      const memberData = await this.supabaseService.getMembers();
      
      // Fetch attendance counts for all sabhas
      const { data: attendanceData, error: attError } = await this.supabaseService.client
        .from('attendance')
        .select('sabha_id, attendance_date, status, member_id');

      if (attError) throw attError;

      this.sabhas = sabhaData.map((item: any) => {
        // Members assigned to this sabha group
        const groupMembers = memberData.filter((m: any) => m.sabha_name === item.title);
        
        // Map attendance status to each member for this specific date
        const membersWithStatus = groupMembers.map((m: any) => {
          const att = (attendanceData || []).find(a => 
            a.sabha_id === item.id && a.attendance_date === item.sabha_date && a.member_id === m.id
          );
          return {
            ...m,
            attendanceStatus: att ? att.status : null
          };
        });

        const presentCount = membersWithStatus.filter(m => m.attendanceStatus === 'P').length;

        return {
          id: item.id,
          title: item.title,
          sabhaType: item.sabha_type,
          sabhaDate: item.sabha_date,
          timeSchedule: item.time_schedule,
          assignedMembers: membersWithStatus,
          presentCount: presentCount
        };
      });
    } catch (error) {
      console.error('Error loading sabhas:', error);
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.sabhaForm.reset({
        title: 'Yuva Sabha',
        sabhaType: 'Weekly Sabha', 
        sabhaDate: new Date().toISOString().split('T')[0]
      });
      this.editingId = null;
    }
  }

  editSabha(s: any) {
    this.showForm = true;
    this.editingId = s.id;
    this.sabhaForm.patchValue({
      title: s.title,
      sabhaType: s.sabhaType,
      sabhaDate: s.sabhaDate,
      timeSchedule: s.timeSchedule
    });
  }

  async deleteSabha(id: string) {
    if (confirm('Delete this scheduled Sabha?')) {
      const { error } = await this.supabaseService.deleteSabha(id);
      if (!error) {
        this.loadSabhas();
      } else {
        alert('Failed to delete: ' + error.message);
      }
    }
  }

  async onSubmit() {
    if (this.sabhaForm.valid) {
      this.loading = true;
      try {
        const formValue = this.sabhaForm.value;
        const dbPayload = {
          title: formValue.title,
          sabha_type: formValue.sabhaType,
          time_schedule: formValue.timeSchedule,
          sabha_date: formValue.sabhaDate
        };

        const { error } = await this.supabaseService.saveSabha(dbPayload, this.editingId || undefined);
        
        if (error) {
          alert('Failed to save: ' + error.message);
          return;
        }

        alert('Sabha schedule updated successfully! ✨');
        this.loadSabhas();
        this.toggleForm();
      } catch (err: any) {
        console.error(err);
        alert('Unexpected error occurred.');
      } finally {
        this.loading = false;
      }
    } else {
      this.sabhaForm.markAllAsTouched();
    }
  }

  showParticipants(s: any) {
    this.selectedSabha = s;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSabha = null;
  }
}
