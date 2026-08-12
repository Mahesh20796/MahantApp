import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(false);

  constructor() {
    this.loadTheme();
  }

  toggleTheme() {
    this.darkMode.set(!this.darkMode());
    this.saveTheme();
  }

  private saveTheme() {
    localStorage.setItem('theme', this.darkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  private loadTheme() {
    const theme = localStorage.getItem('theme');
    this.darkMode.set(theme === 'dark');
    this.applyTheme();
  }

  private applyTheme() {
    if (this.darkMode()) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
