import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="glass-card login-box animate-fade-in">
        <div class="brand-section">
          <div class="brand-logo">🌌</div>
          <h1 class="brand-title">Sabha <span style="color: var(--primary);">Connect</span></h1>
          <p class="brand-subtitle">Secure management portal gateway</p>
        </div>
        
        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label class="form-label">Administrator Email</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input type="email" name="email" class="glass-input" [(ngModel)]="email" required placeholder="admin@example.com" style="width: 100%; padding-left: 48px;">
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 24px;">
            <label class="form-label">Security Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input type="password" name="password" class="glass-input" [(ngModel)]="password" required placeholder="••••••••" style="width: 100%; padding-left: 48px;">
            </div>
          </div>
          
          <div *ngIf="errorMessage" class="error-toast">
            ⚠️ {{ errorMessage }}
          </div>
          
          <button type="submit" class="btn-submit" [disabled]="loading">
            <span *ngIf="!loading">Launch Dashboard 🚀</span>
            <span *ngIf="loading" class="spinner">⚙️ Validating...</span>
          </button>
        </form>

        <div class="footer-links">
           <a href="javascript:void(0)">Forgot Password?</a>
           <span>•</span>
           <a href="javascript:void(0)">System Help</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: var(--bg-gradient);
    }
    .login-box {
      width: 100%;
      max-width: 460px;
      padding: 56px;
    }
    .brand-section {
      text-align: center;
      margin-bottom: 48px;
    }
    .brand-logo {
      font-size: 4rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
    }
    .brand-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.04em;
    }
    .brand-subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      margin-top: 8px;
      font-weight: 500;
    }
    .input-wrapper {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.2rem;
      z-index: 10;
    }
    .btn-submit {
      width: 100%;
      height: 60px;
      margin-top: 40px;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: white;
      font-weight: 700;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 20px 30px -10px rgba(99, 102, 241, 0.5);
    }
    .btn-submit:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-toast {
      margin-top: 20px;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      padding: 14px;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      border: 1px solid rgba(239, 68, 68, 0.2);
      text-align: center;
    }
    .footer-links {
      margin-top: 40px;
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .footer-links a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
      transition: all 0.2s;
    }
    .footer-links a:hover {
      color: var(--accent);
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  async ngOnInit() {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLogin() {
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = err.message || 'Error occurred during login';
    } finally {
      this.loading = false;
    }
  }
}
