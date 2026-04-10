import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 20px;">
         <div>
            <h2 class="card-title" style="margin-bottom: 4px;">📝 Attendance Tracking</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Record and manage presence for scheduled meetings.</p>
         </div>
         <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Current Session Date</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">{{ selectedDate | date:'fullDate' }}</div>
            <div *ngIf="unmarkedCount > 0" style="font-size: 0.7rem; color: var(--warning); font-weight: 700;">⚠️ {{ unmarkedCount }} members remaining</div>
            <div *ngIf="unmarkedCount === 0 && attendanceList.length > 0" style="font-size: 0.7rem; color: var(--success); font-weight: 700;">✅ Everyone marked</div>
         </div>
      </div>
      
      <div style="background: var(--bg-sidebar-hover); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-muted);">Active Sabha Module</label>
          <select class="form-control premium-input" [(ngModel)]="selectedSabhaId" (change)="onSabhaChange()">
            <option value="" disabled>-- Select Sabha --</option>
            <option *ngFor="let s of sabhas" [value]="s.id">{{ s.title }}</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-muted);">Operational Date</label>
          <input type="date" class="form-control premium-input" [(ngModel)]="selectedDate" (change)="loadAttendance()">
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
                <span *ngIf="record.timestamp">🕒 {{ (record.timestamp | date:'h:mm:ss a':'UTC') | lowercase }}</span>
                <span *ngIf="!record.timestamp">--:--</span>
              </td>
              <td>
                <div style="display:flex; gap: 8px; justify-content: flex-end;">
                  <button class="btn" [style.background]="record.status === 'P' ? 'var(--success)' : 'var(--bg-sidebar-hover)'" [style.color]="record.status === 'P' ? 'white' : 'var(--text-muted)'" style="padding: 10px 18px; border-radius: 12px; border: 1px solid var(--border-color); font-weight: 800; transition: all 0.3s;" (click)="mark(record, 'P')">P</button>
                  <button class="btn" [style.background]="record.status === 'A' ? 'var(--danger)' : 'var(--bg-sidebar-hover)'" [style.color]="record.status === 'A' ? 'white' : 'var(--text-muted)'" style="padding: 10px 18px; border-radius: 12px; border: 1px solid var(--border-color); font-weight: 800; transition: all 0.3s;" (click)="mark(record, 'A')">A</button>
                  <button class="btn" [style.background]="record.status === 'L' ? 'var(--warning)' : 'var(--bg-sidebar-hover)'" [style.color]="record.status === 'L' ? 'white' : 'var(--text-muted)'" style="padding: 10px 18px; border-radius: 12px; border: 1px solid var(--border-color); font-weight: 800; transition: all 0.3s;" (click)="mark(record, 'L')">L</button>
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
              <span *ngIf="record.timestamp" style="font-size: 0.65rem; color: var(--text-muted);">🕒 {{ (record.timestamp | date:'h:mm:ss a':'UTC') | lowercase }}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px;">
              <button class="btn" (click)="mark(record, 'P')" 
                      [style.background]="record.status === 'P' ? 'var(--success)' : 'var(--bg-sidebar-hover)'" 
                      [style.color]="record.status === 'P' ? 'white' : 'var(--text-muted)'"
                      style="justify-content: center; padding: 12px; border: 1px solid var(--border-color); font-weight: 800;">
                PRESENT
              </button>
              <button class="btn" (click)="mark(record, 'A')" 
                      [style.background]="record.status === 'A' ? 'var(--danger)' : 'var(--bg-sidebar-hover)'" 
                      [style.color]="record.status === 'A' ? 'white' : 'var(--text-muted)'"
                      style="justify-content: center; padding: 12px; border: 1px solid var(--border-color); font-weight: 800;">
                ABSENT
              </button>
              <button class="btn" (click)="mark(record, 'L')" 
                      [style.background]="record.status === 'L' ? 'var(--warning)' : 'var(--bg-sidebar-hover)'" 
                      [style.color]="record.status === 'L' ? 'white' : 'var(--text-muted)'"
                      style="justify-content: center; padding: 12px; border: 1px solid var(--border-color); font-weight: 800;">
                LEAVE
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="attendanceList.length === 0" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; opacity: 0.1; margin-bottom: 16px;">📋</div>
        <div style="font-weight: 700; color: #94a3b8;">No members found for this configuration.</div>
      </div>
      
      <!-- Footer Actions -->
      <div style="margin-top: auto; padding-top: 32px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
         <!-- Pagination -->
         <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn" style="background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); padding: 12px; border-radius: 14px; color: var(--text-dark);" [disabled]="currentPage === 1" (click)="previousPage()">←</button>
            <span style="font-size: 0.9rem; font-weight: 800; color: var(--text-muted); padding: 0 16px;">P. {{ currentPage }} / {{ totalPages || 1 }}</span>
            <button class="btn" style="background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); padding: 12px; border-radius: 14px; color: var(--text-dark);" [disabled]="currentPage === totalPages" (click)="nextPage()">→</button>
         </div>

         <button class="btn" (click)="saveAttendance()" [disabled]="!isAnyMarked || isLoading" 
                 [style.background]="isAnyMarked ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'var(--bg-sidebar-hover)'"
                 style="height: 56px; padding: 0 48px; border-radius: var(--radius-md); color: white; font-weight: 800; font-size: 1rem; border: none; box-shadow: var(--shadow-premium);">
           💾 Commit Attendance Records
         </button>
      </div>
      <!-- Floating Action Button for Mobile Commit -->
      <button class="fab show-on-mobile animate-fade-in" (click)="saveAttendance()" *ngIf="isAnyMarked" [disabled]="isLoading" aria-label="Commit Records Swapped">
        <span style="font-size: 1.5rem;">💾</span>
      </button>
    </div>
  `
})
export class AttendanceManagementComponent implements OnInit {
  supabaseService = inject(SupabaseService);
  
  sabhas: any[] = [];
  selectedSabhaId: string = '';
  selectedDate: string = '';
  searchQuery: string = '';
  attendanceList: AttendanceRecord[] = [];
  isLoading = false;

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
      this.selectedDate = new Date().toISOString().split('T')[0]; // Default to today
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
           return m.status === 'Active' && 
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
            timestamp: att ? new Date(att.time_marked) : null
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
      // Direct real-time save to Supabase
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

