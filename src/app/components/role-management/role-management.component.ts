import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role.model';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card animate-fade-in" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        <div>
          <h2 class="card-title" style="margin-bottom: 4px;">🛡️ Role Management</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Define system-wide roles and granular permission matrices.</p>
        </div>
        <button class="btn" [ngClass]="showForm ? 'btn-danger' : 'btn-primary'" (click)="toggleForm()" style="height: 44px; border-radius: 12px; white-space: nowrap; flex-shrink: 0;">
          {{ showForm ? '✕ Close Form' : '+ Create New Role' }}
        </button>
      </div>

      <div *ngIf="showForm" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px;">
            <div class="form-group">
              <label class="form-label">Role Designation *</label>
              <input type="text" class="form-control premium-input" formControlName="name" placeholder="E.g. Sampark Karyakar">
            </div>
            
            <div class="form-group">
              <label class="form-label">Role Type *</label>
              <select class="form-control premium-input" formControlName="roleType">
                 <option value="Admin">Full Access (Admin)</option>
                 <option value="Limited">Limited Access (Executive)</option>
                 <option value="Basic">Basic Access (Volunteer)</option>
              </select>
            </div>

            <div class="form-group" style="grid-column: span 1.5;">
              <label class="form-label">Role Description *</label>
              <textarea class="form-control premium-input" formControlName="description" rows="2" placeholder="Briefly describe the responsibilities..."></textarea>
            </div>
          </div>

          <!-- Permission Matrix -->
          <div class="permission-matrix-container">
             <h4 style="margin-bottom: 16px; font-size: 1rem; font-weight: 800; color: #FFFFFF;">🔒 Module Permissions Matrix</h4>
             <div class="table-responsive">
                <table class="permission-table">
                   <thead>
                      <tr>
                         <th>System Module</th>
                         <th style="text-align: center;">View</th>
                         <th style="text-align: center;">Create</th>
                         <th style="text-align: center;">Edit</th>
                         <th style="text-align: center;">Delete</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr *ngFor="let mod of modules">
                         <td>
                            <div style="font-weight: 700; color: #FFFFFF;">{{ mod.label }}</div>
                         </td>
                         <td style="text-align: center;"><input type="checkbox" class="perm-check" [formControlName]="mod.id + '_view'"></td>
                         <td style="text-align: center;"><input type="checkbox" class="perm-check" [formControlName]="mod.id + '_create'"></td>
                         <td style="text-align: center;"><input type="checkbox" class="perm-check" [formControlName]="mod.id + '_edit'"></td>
                         <td style="text-align: center;"><input type="checkbox" class="perm-check" [formControlName]="mod.id + '_delete'"></td>
                      </tr>
                   </tbody>
                </table>
             </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 32px;">
            <button type="submit" class="btn btn-success" [disabled]="roleForm.invalid" style="height: 52px; min-width: 200px; justify-content: center; font-size: 1rem; border-radius: var(--radius-md); box-shadow: var(--shadow-md);">
              ✨ {{ editingId ? 'Update Permissions' : 'Initialize Role' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card animate-slide-up" *ngIf="!showForm">
      <div class="table-responsive hide-on-mobile">
        <table class="table">
          <thead>
            <tr>
              <th>Role Identity</th>
              <th>Type</th>
              <th>Description</th>
              <th>Permissions Summary</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of roles" class="table-row-hover">
              <td>
                <div style="display: flex; align-items: center; gap: 16px;">
                   <div class="role-icon" [style.background]="getRoleColor(r.name, 0.15)" [style.border-color]="getRoleColor(r.name, 0.3)">
                      <span [style.color]="getRoleColor(r.name)">🛡️</span>
                   </div>
                   <div style="font-weight: 800; color: var(--text-dark); font-size: 1rem;">{{r.name}}</div>
                </div>
              </td>
              <td>
                <span class="badge" [style.background]="getRoleColor(r.name, 0.1)" [style.color]="getRoleColor(r.name)" 
                      style="font-weight: 900; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 8px; border: 1px solid currentColor;">
                  {{ (r.name.includes('Admin') || r.name.includes('Sanchalak') ? 'Super Admin' : 'Staff') | uppercase }}
                </span>
              </td>
              <td>
                <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600; max-width: 250px;">
                  {{r.description}}
                </div>
              </td>
              <td>
                 <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <span *ngFor="let p of getPermissionSummary(r)" class="mini-pill" 
                          style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted); padding: 4px 10px; border-radius: 8px;">
                       {{ p }}
                    </span>
                 </div>
              </td>
              <td>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                   <button class="btn edit-btn" (click)="editRole(r)" style="background: var(--bg-card); border-color: var(--border-color);">✏️</button>
                   <button class="btn delete-btn" (click)="deleteRole(r.id)" style="background: #fff5f5; border-color: #ffe3e3;">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile View -->
      <div class="show-on-mobile">
        <div class="mobile-card-list">
          <div *ngFor="let r of roles" class="mobile-card">
            <div class="mobile-card-header">
               <div style="font-weight: 800; color: var(--text-dark); font-size: 1.1rem;">{{r.name}}</div>
               <span class="badge" [style.background]="getRoleColor(r.name, 0.1)" [style.color]="getRoleColor(r.name)">{{ (r.name.includes('Admin') || r.name.includes('Sanchalak') ? 'Super Admin' : 'Staff') | uppercase }}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin: 16px 0; font-weight: 500;">{{ r.description }}</p>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
               <button class="btn" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark); padding: 10px 20px; border-radius: 10px;" (click)="editRole(r)">Edit</button>
               <button class="btn" style="background: #fff5f5; border: 1px solid #ffe3e3; color: var(--danger); padding: 10px 20px; border-radius: 10px;" (click)="deleteRole(r.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .permission-matrix-container {
      background: var(--bg-sidebar);
      padding: 24px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      color: white;
    }
    .permission-table {
      width: 100%;
      border-collapse: collapse;
    }
    .permission-table th {
      padding: 12px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 2px solid var(--border-color);
    }
    .permission-table td {
      padding: 14px 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .perm-check {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary);
    }
    .role-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .mini-pill {
      font-size: 0.65rem;
      padding: 2px 8px;
      background: var(--bg-sidebar-hover);
      color: var(--text-muted);
      border-radius: 6px;
      border: 1px solid var(--border-color);
      font-weight: 700;
      text-transform: capitalize;
    }
    .edit-btn, .delete-btn {
      padding: 10px;
      background: var(--bg-sidebar-hover);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      border-radius: 10px;
    }
    .delete-btn {
      background: rgba(239, 68, 68, 0.05);
      color: var(--danger);
      border-color: rgba(239, 68, 68, 0.1);
    }
  `]
})
export class RoleManagementComponent implements OnInit {
  supabaseService = inject(SupabaseService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);
  
  roles: Role[] = [];
  showForm = false;
  editingId: string | null = null;

  modules = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'sabha_history', label: '🗓️ Sabha History' },
    { id: 'members', label: '👥 Members' },
    { id: 'roles', label: '🛡️ Roles' },
    { id: 'attendance', label: '📝 Attendance' },
    { id: 'financials', label: '💰 Financials' },
    { id: 'reports', label: '📈 Reports' }
  ];

  roleForm: FormGroup = this.initForm();

  initForm() {
    const group: any = {
      name: ['', Validators.required],
      roleType: ['Limited', Validators.required],
      description: ['', Validators.required],
      year: [new Date().getFullYear()]
    };

    // Add module-based controls
    this.modules.forEach(m => {
      group[`${m.id}_view`] = [false];
      group[`${m.id}_create`] = [false];
      group[`${m.id}_edit`] = [false];
      group[`${m.id}_delete`] = [false];
    });

    return this.fb.group(group);
  }

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
    if (!this.showForm) this.roleForm.reset({ roleType: 'Limited', year: new Date().getFullYear() });
    this.editingId = null;
  }

  editRole(r: Role) {
    this.showForm = true;
    this.editingId = r.id!;
    
    const patchObj: any = {
      name: r.name,
      description: r.description,
      year: r.year,
      roleType: r.name.includes('Admin') ? 'Admin' : 'Limited'
    };

    const perms = r.permissions || this.authService.getPermissionsByRole(r.name);
    
    if (perms) {
      Object.keys(perms).forEach(mod => {
        const p = (perms as any)[mod];
        patchObj[`${mod}_view`] = p.view;
        patchObj[`${mod}_create`] = p.create;
        patchObj[`${mod}_edit`] = p.edit;
        patchObj[`${mod}_delete`] = p.delete;
      });
    }

    this.roleForm.patchValue(patchObj);
  }

  getPermissionSummary(r: Role): string[] {
    const perms = r.permissions || this.authService.getPermissionsByRole(r.name);
    if (!perms) return ['No Permissions'];
    const summary: string[] = [];
    Object.keys(perms).forEach(mod => {
      const p = (perms as any)[mod];
      if (p.view) summary.push(mod.replace('_', ' '));
    });
    return summary.slice(0, 3).concat(summary.length > 3 ? ['...'] : []);
  }

  getRoleColor(name: string, alpha: number = 1): string {
    if (name.includes('Sanchalak') || name.includes('Admin')) return `rgba(248, 113, 113, ${alpha})`;
    if (name.includes('Karyakar')) return `rgba(96, 165, 250, ${alpha})`;
    return `rgba(148, 163, 184, ${alpha})`;
  }

  async deleteRole(id: string | undefined) {
    if (!id) return;
    if (confirm('Are you sure? This may affect members assigned to this role.')) {
      const { error } = await this.supabaseService.client.from('roles').delete().eq('id', id);
      if (!error) {
        alert('Role deleted successfully!');
        this.loadRoles();
      }
    }
  }

  async onSubmit() {
    if (this.roleForm.valid) {
      try {
        const val = this.roleForm.value;
        const permissions: any = {};
        
        this.modules.forEach(m => {
          permissions[m.id] = {
            view: val[`${m.id}_view`],
            create: val[`${m.id}_create`],
            edit: val[`${m.id}_edit`],
            delete: val[`${m.id}_delete`]
          };
        });

        const payload = {
          name: val.name,
          description: val.description,
          year: val.year,
          permissions: permissions
        };

        let result;
        if (this.editingId) {
          result = await this.supabaseService.updateRole(this.editingId, payload);
        } else {
          result = await this.supabaseService.addRole(payload);
        }
        
        if (result.error) throw result.error;

        alert('Role configuration synchronized! 🛡️');
        this.loadRoles();
        this.toggleForm();
      } catch (err: any) {
        console.error('Submit Error:', err);
        if (err.message?.includes('permissions') || err.code === 'PGRST204') {
          alert('⚠️ Database Schema Mismatch: The "permissions" column is missing in your "roles" table. Please run the SQL migration provided in the report.');
        } else {
          alert('Error: ' + err.message);
        }
      }
    }
  }
}
