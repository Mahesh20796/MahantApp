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
    <div class="login-wrapper">
      <div class="gradient-bg"></div>
      
      <div class="login-container animate-slide-up">
        <div class="glass-login-box">
          <div class="login-header">
            <div class="logo-circle" style="overflow: hidden; padding: 0;">
               <img src="assets/logo.png" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h1 class="login-title">Rana Mandal <span class="accent-text">Sabha</span></h1>
            <p class="login-subtitle">Official Administrative Intelligence Portal</p>
          </div>
          
          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="input-section">
              <div class="form-group">
                <label class="premium-label">Administrator Email</label>
                <div class="glass-input-wrapper">
                  <span class="input-icon">✉️</span>
                  <input type="email" name="email" class="premium-input" [(ngModel)]="email" required placeholder="admin@sabha.com">
                </div>
              </div>
              
              <div class="form-group">
                <label class="premium-label">Security Password</label>
                <div class="glass-input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input type="password" name="password" class="premium-input" [(ngModel)]="password" required placeholder="••••••••">
                </div>
              </div>
            </div>
            
            <div *ngIf="errorMessage" class="login-error animate-fade-in">
              <span class="error-icon">⚠️</span> {{ errorMessage }}
            </div>
            
            <button type="submit" class="submit-button" [disabled]="loading">
              <span *ngIf="!loading">Launch Dashboard <span class="rocket">🚀</span></span>
              <span *ngIf="loading" class="loading-state">
                <span class="spinner-icon">⚙️</span> Authenticating...
              </span>
            </button>
          </form>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --login-accent: #F87941; }

    .login-wrapper {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #020617;
      font-family: 'Outfit', sans-serif;
    }

    .gradient-bg {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 75% 15%, rgba(248, 121, 65, 0.15) 0%, transparent 40%),
                  radial-gradient(circle at 25% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 40%);
      animation: drift 20s linear infinite;
      z-index: 1;
    }

    @keyframes drift {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .login-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 480px;
      padding: 24px;
    }

    .glass-login-box {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 32px;
      padding: 48px;
      box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8),
                  inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(248, 121, 65, 0.1), rgba(248, 121, 65, 0.02));
      border: 1px solid rgba(248, 121, 65, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 10px 40px -10px rgba(30, 58, 138, 0.3);
    }

    .logo-emoji {
      font-size: 2.5rem;
      filter: drop-shadow(0 0 8px var(--login-accent));
    }

    .login-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.05em;
      margin: 0;
    }

    .accent-text { color: var(--login-accent); }

    .login-subtitle {
      color: #B1B1B1;
      font-size: 0.95rem;
      margin-top: 8px;
      font-weight: 500;
    }

    .input-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .premium-label {
      display: block;
      color: #B1B1B1;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      margin-left: 4px;
    }

    .glass-input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
      opacity: 0.7;
    }

    .premium-input {
      width: 100%;
      height: 56px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 0 20px 0 52px;
      color: white;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .premium-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--login-accent);
      box-shadow: 0 0 0 4px rgba(248, 121, 65, 0.1);
    }

    .login-error {
      margin-top: 20px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
    }

    .submit-button {
      width: 100%;
      height: 60px;
      margin-top: 32px;
      border: none;
      border-radius: 18px;
      background: linear-gradient(135deg, #F87941 0%, #E66A31 100%);
      color: white;
      font-weight: 800;
      font-size: 1.1rem;
      letter-spacing: -0.01em;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 16px 32px -8px rgba(248, 121, 65, 0.4);
    }

    .submit-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 24px 48px -12px rgba(248, 121, 65, 0.5);
      filter: brightness(1.1);
    }

    .submit-button:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .spinner-icon {
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }


    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
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
