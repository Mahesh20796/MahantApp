import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

interface AttendanceRecord {
  memberId: string;
  memberName: string;
  role: string;
  memberStatus: string;
  status: 'P' | 'A' | 'L' | null;
  timestamp: Date | null;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card animate-fade-in" style="min-height: 80vh; position: relative; overflow: hidden;">
      <!-- Skeleton Overlay for Form/Header -->
      <div *ngIf="isLoading && attendanceList.length === 0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--glass-bg); display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: var(--radius-lg); backdrop-filter: blur(4px);">
        <div class="skeleton" style="width: 80%; height: 80%;"></div>
      </div>
      <div class="page-header" style="margin-bottom: 24px; gap: 16px;">
         <div>
            <h2 class="card-title" style="margin-bottom: 4px; font-size: 1.25rem;">📝 Attendance</h2>
            <p style="color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">Registry tracking session active.</p>
         </div>
         <div style="background: var(--primary-soft); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(248, 121, 65, 0.2); flex: 1; min-width: 150px;">
            <div style="font-size: 0.65rem; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Session Date</div>
            <div style="font-size: 1rem; font-weight: 800; color: var(--text-dark);">{{ selectedDate | date:'mediumDate' }}</div>
            <div *ngIf="unmarkedCount > 0" style="font-size: 0.65rem; color: var(--warning); font-weight: 700; margin-top: 4px;">● {{ unmarkedCount }} members remaining</div>
            <div *ngIf="unmarkedCount === 0 && attendanceList.length > 0" style="font-size: 0.65rem; color: var(--success); font-weight: 700; margin-top: 4px;">● Everyone marked</div>
         </div>
      </div>
      
      <div style="background: var(--bg-sidebar-hover); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-muted);">Active Sabha Module</label>
          <select class="form-control premium-input" [(ngModel)]="selectedSabhaId" (change)="onSabhaChange()">
            <option value="" disabled>-- Select Scheduled Sabha --</option>
            <option *ngFor="let s of sabhas" [value]="s.id">{{ s.title }} ({{ s.sabha_date | date:'dd-MM-yyyy' }})</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-muted);">Operational Date</label>
          <input type="date" class="form-control premium-input" [(ngModel)]="selectedDate" (change)="loadAttendance()" [max]="maxDate" [disabled]="!!selectedSabhaId">
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-muted);">Instant Search</label>
          <div style="position: relative;">
            <input type="text" class="form-control premium-input" [(ngModel)]="searchQuery" (ngModelChange)="currentPage = 1" placeholder="Search member name...">
            <span style="position: absolute; right: 12px; top: 12px; opacity: 0.4;">🔍</span>
          </div>
        </div>
      </div>

      <div class="table-responsive hide-on-mobile">
        <table class="table">
          <thead>
            <tr>
              <th>Member Identity</th>
              <th>Status Badge</th>
              <th>Log Time</th>
              <th style="text-align: right;">Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let record of paginatedAttendanceList" class="table-row-hover">
              <td>
                <div style="display: flex; align-items: center; gap: 14px;">
                   <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-soft); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary); font-size: 0.9rem; border: 1px solid var(--border-color);">
                      {{ record.memberName ? record.memberName.charAt(0) : '?' }}
                   </div>
                   <div>
                      <div style="font-weight: 700; color: var(--text-dark); font-size: 0.95rem;">{{ record.memberName }}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">{{ record.role }}</div>
                   </div>
                </div>
              </td>
              <td>
                <span class="badge" *ngIf="record.status" 
                      [style.background]="record.status === 'P' ? 'rgba(16, 185, 129, 0.15)' : (record.status === 'A' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')"
                      [style.color]="record.status === 'P' ? '#10b981' : (record.status === 'A' ? '#ef4444' : '#f59e0b')"
                      [style.border]="record.status === 'P' ? '1px solid rgba(16, 185, 129, 0.2)' : (record.status === 'A' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)')">
                  {{ record.status === 'P' ? 'Present ✅' : record.status === 'A' ? 'Absent ❌' : 'Leave 🏠' }}
                </span>
                <span *ngIf="!record.status" style="color: var(--text-muted); background: var(--bg-sidebar-hover); padding: 8px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; border: 1px solid var(--border-color); letter-spacing: 0.05em;">UNMARKED</span>
              </td>
              <td style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                <span *ngIf="record.timestamp">🕒 {{ (record.timestamp | date:'h:mm:ss a') | lowercase }}</span>
                <span *ngIf="!record.timestamp">--:--</span>
              </td>
              <td>
                <div style="display:flex; gap: 8px; justify-content: flex-end;">
                  <button class="btn" 
                          [disabled]="!selectedSabhaId"
                          [style.background]="record.status === 'P' ? 'var(--success)' : 'rgba(16, 185, 129, 0.08)'" 
                          [style.color]="record.status === 'P' ? 'white' : 'var(--success)'" 
                          [style.border-color]="record.status === 'P' ? 'var(--success)' : 'rgba(16, 185, 129, 0.2)'"
                          style="padding: 10px 20px; border-radius: 12px; font-weight: 800; border: 1.5px solid; transition: all 0.2s; opacity: selectedSabhaId ? 1 : 0.5;" (click)="mark(record, 'P')">P</button>
                  <button class="btn" 
                          [disabled]="!selectedSabhaId"
                          [style.background]="record.status === 'A' ? 'var(--danger)' : 'rgba(239, 68, 68, 0.08)'" 
                          [style.color]="record.status === 'A' ? 'white' : 'var(--danger)'" 
                          [style.border-color]="record.status === 'A' ? 'var(--danger)' : 'rgba(239, 68, 68, 0.2)'"
                          style="padding: 10px 20px; border-radius: 12px; font-weight: 800; border: 1.5px solid; transition: all 0.2s; opacity: selectedSabhaId ? 1 : 0.5;" (click)="mark(record, 'A')">A</button>
                  <button class="btn" 
                          [disabled]="!selectedSabhaId"
                          [style.background]="record.status === 'L' ? 'var(--warning)' : 'rgba(245, 158, 11, 0.08)'" 
                          [style.color]="record.status === 'L' ? 'white' : 'var(--warning)'" 
                          [style.border-color]="record.status === 'L' ? 'var(--warning)' : 'rgba(245, 158, 11, 0.2)'"
                          style="padding: 10px 20px; border-radius: 12px; font-weight: 800; border: 1.5px solid; transition: all 0.2s; opacity: selectedSabhaId ? 1 : 0.5;" (click)="mark(record, 'L')">L</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Skeleton Loader for List -->
      <div *ngIf="isLoading && attendanceList.length === 0" style="padding: 20px;">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton" style="height: 100px; margin-bottom: 16px; border-radius: var(--radius-md); opacity: 0.5;"></div>
      </div>

      <!-- Mobile card layout for attendance -->
      <div class="show-on-mobile" *ngIf="!isLoading || attendanceList.length > 0">
        <div class="mobile-card-list">
          <div *ngFor="let record of filteredAttendanceList" class="mobile-card">
            <div class="mobile-card-header">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--primary-soft); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary);">
                  {{ record.memberName ? record.memberName.charAt(0) : '?' }}
                </div>
                <div>
                  <div style="font-weight: 700; color: var(--text-dark);">{{ record.memberName }}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">{{ record.role }}</div>
                </div>
              </div>
              <span *ngIf="record.timestamp" style="font-size: 0.65rem; color: var(--text-muted);">🕒 {{ (record.timestamp | date:'h:mm:ss a') | lowercase }}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px;">
              <button class="btn" (click)="mark(record, 'P')" 
                      [disabled]="!selectedSabhaId"
                      [style.background]="record.status === 'P' ? 'var(--success)' : 'var(--bg-card)'" 
                      [style.color]="record.status === 'P' ? 'white' : 'var(--text-dark)'"
                      style="justify-content: center; padding: 14px 8px; border: 1px solid var(--border-color); font-weight: 800; border-radius: 12px; font-size: 0.75rem; box-shadow: var(--shadow-sm); opacity: selectedSabhaId ? 1 : 0.5;">
                {{ record.status === 'P' ? 'PRESENT ✅' : 'PRESENT' }}
              </button>
              <button class="btn" (click)="mark(record, 'A')" 
                      [disabled]="!selectedSabhaId"
                      [style.background]="record.status === 'A' ? 'var(--danger)' : 'var(--bg-card)'" 
                      [style.color]="record.status === 'A' ? 'white' : 'var(--text-dark)'"
                      style="justify-content: center; padding: 14px 8px; border: 1px solid var(--border-color); font-weight: 800; border-radius: 12px; font-size: 0.75rem; box-shadow: var(--shadow-sm); opacity: selectedSabhaId ? 1 : 0.5;">
                {{ record.status === 'A' ? 'ABSENT ❌' : 'ABSENT' }}
              </button>
              <button class="btn" (click)="mark(record, 'L')" 
                      [disabled]="!selectedSabhaId"
                      [style.background]="record.status === 'L' ? 'var(--warning)' : 'var(--bg-card)'" 
                      [style.color]="record.status === 'L' ? 'white' : 'var(--text-dark)'"
                      style="justify-content: center; padding: 14px 8px; border: 1px solid var(--border-color); font-weight: 800; border-radius: 12px; font-size: 0.75rem; box-shadow: var(--shadow-sm); opacity: selectedSabhaId ? 1 : 0.5;">
                {{ record.status === 'L' ? 'LEAVE 🏠' : 'LEAVE' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="attendanceList.length === 0" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; opacity: 0.1; margin-bottom: 16px;">📋</div>
        <div style="font-weight: 700; color: var(--text-muted);">No members found for this configuration.</div>
      </div>
      
      <!-- Footer Actions -->
      <div style="margin-top: auto; padding-top: 32px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
         <!-- Pagination -->
         <div style="display: flex; gap: 10px; align-items: center; width: 100%; justify-content: center;">
            <button class="btn" style="background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); padding: 12px; border-radius: 14px; color: var(--text-dark);" [disabled]="currentPage === 1" (click)="previousPage()">←</button>
            <span style="font-size: 0.9rem; font-weight: 800; color: var(--text-muted); padding: 0 16px;">P. {{ currentPage }} / {{ totalPages || 1 }}</span>
            <button class="btn" style="background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); padding: 12px; border-radius: 14px; color: var(--text-dark);" [disabled]="currentPage === totalPages" (click)="nextPage()">→</button>
         </div>

         <button *ngIf="auth.hasPermission('attendance', 'create')" 
                 class="btn hide-on-mobile" (click)="saveAttendance()" [disabled]="!isAnyMarked || isLoading || !selectedSabhaId" 
                 [style.background]="isAnyMarked ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'var(--bg-sidebar-hover)'"
                 style="height: 56px; padding: 0 48px; border-radius: var(--radius-md); color: white; font-weight: 800; font-size: 1rem; border: none; box-shadow: var(--shadow-premium);">
                       <span style="font-size: 1.3rem;">💾</span>
            <span>COMMIT & SAVE ATTENDANCE</span>


         </button>
      </div>
      <!-- Floating Action Button for Mobile Commit -->
      <button class="fab show-on-mobile animate-fade-in" (click)="saveAttendance()" 
              *ngIf="isAnyMarked && auth.hasPermission('attendance', 'create')" 
              [disabled]="isLoading" aria-label="Commit Records Swapped"
              style="display: flex; flex-direction: column; gap: 4px; line-height: 1;">
        <span style="font-size: 1.2rem;">💾</span>
        <span style="font-size: 0.55rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">SAVE</span>
      </button>
    </div>
  `,
  styles: [`
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 32px rgba(248, 113, 113, 0.4);
      z-index: 100;
    }
  `]
})
export class AttendanceManagementComponent implements OnInit {
  supabaseService = inject(SupabaseService);
  auth = inject(AuthService);
  
  sabhas: any[] = [];
  selectedSabhaId: string = '';
  selectedDate: string = '';
  searchQuery: string = '';
  attendanceList: AttendanceRecord[] = [];
  isLoading = false;
  maxDate: string = '';

  constructor() {
    const now = new Date();
    this.maxDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }

  get unmarkedCount() {
    return this.attendanceList.filter(r => r.status === null).length;
  }

  get isAnyMarked() {
    return this.attendanceList.some(r => r.status !== null);
  }

  currentPage: number = 1;
  pageSize: number = 5;

  get filteredAttendanceList() {
    if (!this.searchQuery) return this.attendanceList;
    return this.attendanceList.filter(record => 
      record.memberName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get paginatedAttendanceList() {
    const list = this.filteredAttendanceList;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredAttendanceList.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  async ngOnInit() {
    await this.loadSabhas();
    if (this.sabhas.length > 0) {
      this.selectedSabhaId = this.sabhas[0].id;
      this.onSabhaChange();
    }
  }

  async loadSabhas() {
    try {
      this.sabhas = await this.supabaseService.getSabhas();
    } catch (error) {
      console.error('Error loading sabhas:', error);
    }
  }

  onSabhaChange() {
    const selected = this.sabhas.find(s => s.id === this.selectedSabhaId);
    if (selected) {
      this.selectedDate = selected.sabha_date;
    }
    this.loadAttendance();
  }

  async loadAttendance() {
    if (!this.selectedSabhaId || !this.selectedDate) return;
    this.currentPage = 1;
    this.isLoading = true;
    try {
      const [members, existingAttendance] = await Promise.all([
        this.supabaseService.getMembers(),
        this.supabaseService.getAttendanceForSabha(this.selectedSabhaId, this.selectedDate)
      ]);
        
      const selectedSabha = this.sabhas.find(s => s.id === this.selectedSabhaId);
      const sabhaTitle = selectedSabha ? selectedSabha.title : '';

      this.attendanceList = members
        .filter((m: any) => {
           // Case-insensitive flexible matching for Sabha division
           const memberSabha = (m.sabha_name || '').toLowerCase();
           const currentSabha = sabhaTitle.toLowerCase();
           const memberStatus = (m.status || '').toLowerCase();
           return memberStatus === 'active' && 
                  (memberSabha === currentSabha || currentSabha.includes(memberSabha) || !m.sabha_name);
        })
        .map((m: any) => {
          const att = existingAttendance?.find(a => a.member_id === m.id);
          return {
            memberId: m.id,
            memberName: m.name,
            role: m.role,
            memberStatus: m.status,
            status: att ? att.status : null,
            // Strip timezone info to keep "Visual Sync" (local digits) stable
            timestamp: att ? new Date(att.time_marked.replace(/Z|[-+]\d{2}(:?\d{2})?$/, '')) : null
          };
        });
    } catch (e) {
      console.error('Error loading attendance', e);
    } finally {
      this.isLoading = false;
    }
  }

  async mark(record: AttendanceRecord, status: 'P' | 'A' | 'L') {
    const originalStatus = record.status;
    const originalTime = record.timestamp;
    
    // Update local state for immediate feedback
    record.status = status;
    record.timestamp = new Date();
    
    try {
      // Direct real-time save using 'Visual Sync' (local digits + Z) to show IST in Supabase UI
      const pad = (n: number) => n.toString().padStart(2, '0');
      const now = record.timestamp;
      const visualSyncString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T` +
                               `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}Z`;

      const payload = [{
        sabha_id: this.selectedSabhaId,
        member_id: record.memberId,
        status: record.status,
        attendance_date: this.selectedDate,
        time_marked: visualSyncString
      }];

      await this.supabaseService.saveAttendance(payload);
      console.log(`✅ Real-time save: ${record.memberName} marked ${status}`);
    } catch (error) {
      console.error('❌ Real-time save failed:', error);
      // Revert local state on failure
      record.status = originalStatus;
      record.timestamp = originalTime;
      alert('Failed to save attendance in real-time. Please try again.');
    }
  }

  isAllMarked(): boolean {
    return this.attendanceList.length > 0 && this.attendanceList.every(record => record.status !== null);
  }

  async saveAttendance() {
    // This now serves as a manual "Bulk Sync" button
    this.isLoading = true;
    try {
      const payload = this.attendanceList
        .filter(record => record.status !== null)
        .map(record => {
          const now = record.timestamp || new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          // Visual Sync: Local digits saved as UTC so Supabase UI shows IST digits
          const visualSyncString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T` +
                           `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}Z`;

          return {
            sabha_id: this.selectedSabhaId,
            member_id: record.memberId,
            status: record.status,
            attendance_date: this.selectedDate,
            time_marked: visualSyncString
          };
        });

      if (payload.length > 0) {
        await this.supabaseService.saveAttendance(payload);
        alert(`Successfully synced ${payload.length} records!`);
        await this.loadAttendance();
      }
    } catch (error: any) {
      console.error('Bulk sync error:', error);
      alert('Failed to sync records.');
    } finally {
      this.isLoading = false;
    }
  }
}

