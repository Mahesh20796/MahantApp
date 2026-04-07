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
        <button class="btn" [ngClass]="showForm ? 'btn-danger' : 'btn-primary'" (click)="toggleForm()" style="height: 48px; border-radius: var(--radius-md);" *ngIf="currentTab === 'schedules'">
          {{ showForm ? '✕ Close Form' : '+ New Schedule' }}
        </button>
      </div>

      <!-- Tab Switcher -->
      <div style="display: flex; gap: 8px; margin-top: 28px; background: var(--bg-sidebar-hover); padding: 6px; border-radius: var(--radius-lg); width: fit-content; border: 1px solid var(--border-color);">
        <button class="btn" style="background: var(--primary); color: white; box-shadow: var(--shadow-md); padding: 10px 20px; border-radius: var(--radius-md); font-size: 0.9rem;">
          🗓️ Sabha Schedules
        </button>
      </div>
      
      <div *ngIf="showForm && currentTab === 'schedules'" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="sabhaForm" (ngSubmit)="onSubmit()">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
            <div class="form-group" style="grid-column: span 1.5;">
              <label class="form-label">Sabha Title *</label>
              <input type="text" class="form-control premium-input" formControlName="title" placeholder="e.g. Weekly Yuva Sabha">
            </div>
            
            <div class="form-group">
              <label class="form-label">Sabha Category</label>
              <select class="form-control premium-input" formControlName="sabhaType">
                <option value="Weekly Sabha">Weekly Meeting</option>
                <option value="Special Sabha">Special Event</option>
                <option value="Annual Sabha">Annual Gathering</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Meeting Start Time *</label>
              <input type="time" class="form-control premium-input" formControlName="timeSchedule">
            </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="submit" class="btn btn-success" [disabled]="sabhaForm.invalid" style="height: 48px; border-radius: 14px; min-width: 160px; font-size: 1rem; justify-content: center;">
              ✨ {{ editingId ? 'Update Meeting' : 'Create & Schedule' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card animate-slide-up" *ngIf="!showForm && currentTab === 'schedules'" style="border: 1px solid #eef2f6;">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Meeting Identity</th>
              <th>Category</th>
              <th>Time Slot</th>
              <th>Assigned Core</th>
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
                <div style="display: flex; align-items: center; gap: 10px;">
                   <div style="width: 36px; height: 36px; background: var(--primary-soft); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary);">🕒</div>
                   <span style="font-weight: 700; color: var(--text-dark); font-size: 0.95rem;">{{s.timeSchedule}}</span>
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="display: flex; -webkit-mask: linear-gradient(to right, black 70%, transparent);">
                       <div *ngFor="let i of [1,2,3]" style="width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; border: 2px solid white; margin-left: -8px; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #94a3b8;">
                          {{ i }}
                       </div>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">+{{s.assignedMembers.length}} Participants</span>
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button class="btn" style="padding: 10px; background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-md);" (click)="editSabha(s)">✏️</button>
                  <button class="btn" style="padding: 10px; background: rgba(225, 29, 72, 0.05); border: 1px solid rgba(225, 29, 72, 0.1); color: var(--danger); border-radius: var(--radius-md);" (click)="deleteSabha(s.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


  `
})
export class SabhaManagementComponent implements OnInit {
  supabaseService = inject(SupabaseService);
  fb = inject(FormBuilder);
  
  sabhas: any[] = [];
  showForm = false;
  editingId: string | null = null;
  currentTab: 'schedules' | 'members' | 'roles' = 'schedules';

  sabhaForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    sabhaType: ['Weekly Sabha', Validators.required],
    timeSchedule: ['', Validators.required]
  });

  ngOnInit() {
    this.loadSabhas();
  }

  async loadSabhas() {
    try {
      const sabhaData = await this.supabaseService.getSabhas();
      const memberData = await this.supabaseService.getMembers(); // Get all members to count them
      
      this.sabhas = sabhaData.map((item: any) => {
        // Find members who belong to this Sabha title
        const assigned = memberData.filter((m: any) => m.sabha_name === item.title);
        
        return {
          id: item.id,
          title: item.title,
          sabhaType: item.sabha_type,
          sabhaDate: item.sabha_date,
          timeSchedule: item.time_schedule,
          assignedMembers: assigned 
        };
      });
    } catch (error) {
      console.error('Error loading sabhas:', error);
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.sabhaForm.reset({sabhaType: 'Weekly Sabha'});
    this.editingId = null;
  }

  editSabha(s: Sabha) {
    this.showForm = true;
    this.editingId = s.id;
    this.sabhaForm.patchValue({
      ...s
    });
  }

  async deleteSabha(id: string) {
    if (confirm('Delete this scheduled Sabha?')) {
      const { error } = await this.supabaseService.client.from('sabhas').delete().eq('id', id);
      if (!error) {
        this.sabhas = this.sabhas.filter(s => s.id !== id);
      }
    }
  }

  async onSubmit() {
    if (this.sabhaForm.valid) {
      try {
        const formValue = this.sabhaForm.value;
        
        let timeFormatted = formValue.timeSchedule;
        if (timeFormatted && timeFormatted.length === 5) {
          timeFormatted += ':00';
        }

        const dbPayload = {
          title: formValue.title,
          sabha_type: formValue.sabhaType,
          time_schedule: timeFormatted,
          sabha_date: new Date().toISOString().split('T')[0]
        };

        let result;
        if (this.editingId) {
          result = await this.supabaseService.client.from('sabhas').update(dbPayload).eq('id', this.editingId);
        } else {
          result = await this.supabaseService.client.from('sabhas').insert([dbPayload]);
        }
        
        if (result && result.error) {
          alert('Failed to save to database: ' + result.error.message);
          return;
        }

        alert('Sabha saved successfully!');
        await this.loadSabhas();
        this.toggleForm();
      } catch (err: any) {
        console.error(err);
        alert('Unexpected error occurred while saving.');
      }
    } else {
      this.sabhaForm.markAllAsTouched();
    }
  }
}
