import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Role } from '../../models/role.model';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card animate-fade-in" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 class="card-title" style="margin-bottom: 4px;">🛡️ Role Management</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Define and maintain system-wide roles and permissions.</p>
        </div>
        <button class="btn" [ngClass]="showForm ? 'btn-danger' : 'btn-primary'" (click)="toggleForm()" style="height: 44px; border-radius: 12px;">
          {{ showForm ? '✕ Close Form' : '+ Create New Role' }}
        </button>
      </div>

      <div *ngIf="showForm" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
            <div class="form-group">
              <label class="form-label">Role Designation *</label>
              <input type="text" class="form-control premium-input" formControlName="name" placeholder="E.g. Lead Volunteer">
            </div>
            
            <div class="form-group">
              <label class="form-label">Academic/Fiscal Year *</label>
              <input type="number" class="form-control premium-input" formControlName="year" placeholder="2026">
            </div>

            <div class="form-group" style="grid-column: span 1.5;">
              <label class="form-label">Role Responsibilities *</label>
              <textarea class="form-control premium-input" formControlName="description" rows="3" placeholder="Briefly describe the key duties and authority..."></textarea>
            </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <button type="submit" class="btn btn-success" [disabled]="roleForm.invalid" style="height: 52px; min-width: 200px; justify-content: center; font-size: 1rem; border-radius: var(--radius-md); box-shadow: var(--shadow-md);">
              ✨ {{ editingId ? 'Update Role Data' : 'Initialize Role' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card animate-slide-up" *ngIf="!showForm">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Role Identity</th>
              <th>Tenure</th>
              <th>Scope & Description</th>
              <th>Registered At</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of roles" class="table-row-hover">
              <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                   <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--primary-soft); border: 1px solid var(--border-color); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">🛡️</div>
                   <div style="font-weight: 700; color: var(--text-dark);">{{r.name}}</div>
                </div>
              </td>
              <td><span class="badge" style="background: var(--bg-sidebar-hover); color: var(--primary); border: 1px solid var(--border-color); font-weight: 800; font-size: 0.75rem;">FY-{{r.year}}</span></td>
              <td>
                <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600; max-width: 300px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  {{r.description}}
                </div>
              </td>
              <td style="color: var(--text-muted); font-size: 0.75rem; font-weight: 600;">{{r.created_at | date:'mediumDate'}}</td>
              <td>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button class="btn" style="padding: 10px; background: var(--bg-sidebar-hover); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-md);" (click)="editRole(r)">✏️</button>
                  <button class="btn" style="padding: 10px; background: rgba(225, 29, 72, 0.05); border: 1px solid rgba(225, 29, 72, 0.1); color: var(--danger); border-radius: var(--radius-md);" (click)="deleteRole(r.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RoleManagementComponent implements OnInit {
  supabaseService = inject(SupabaseService);
  fb = inject(FormBuilder);
  
  roles: Role[] = [];
  showForm = false;
  editingId: string | null = null;

  roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    description: ['', Validators.required]
  });

  ngOnInit() {
    this.loadRoles();
  }

  async loadRoles() {
    try {
      this.roles = await this.supabaseService.getRoles();
    } catch (e) {
      console.error(e);
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.roleForm.reset();
    this.editingId = null;
  }

  editRole(r: Role) {
    this.showForm = true;
    this.editingId = r.id!;
    this.roleForm.patchValue({
      name: r.name,
      year: r.year,
      description: r.description
    });
  }

  async deleteRole(id: string | undefined) {
    if (!id) return;
    if (confirm('Are you sure? This may affect members assigned to this role.')) {
      const { error } = await this.supabaseService.client.from('roles').delete().eq('id', id);
      if (!error) {
        alert('Role deleted successfully!');
        this.loadRoles();
      } else {
        alert('Error: ' + error.message);
      }
    }
  }

  async onSubmit() {
    if (this.roleForm.valid) {
      try {
        const payload = this.roleForm.value;
        let result;
        if (this.editingId) {
          result = await this.supabaseService.client.from('roles').update(payload).eq('id', this.editingId);
        } else {
          result = await this.supabaseService.client.from('roles').insert([payload]);
        }
        
        if (result.error) {
           alert('Database error: ' + result.error.message);
           return;
        }

        alert('Role saved successfully!');
        this.loadRoles();
        this.toggleForm();
      } catch (err) {
        alert('Network error while saving role.');
      }
    } else {
      this.roleForm.markAllAsTouched();
    }
  }
}
