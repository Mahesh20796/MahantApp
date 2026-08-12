import { Component, inject, HostListener, ViewChild, ElementRef, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { SupabaseService } from './services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';

import { VoiceAssistantService } from './services/voice-assistant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  router = inject(Router);
  supabase = inject(SupabaseService);
  swUpdate = inject(SwUpdate);
  voiceAssistant = inject(VoiceAssistantService);
  
  title = 'Sabha Management System';
  
  isVoiceActive = false;
  currentTranscript = '';
  isListening = false;

  isSearchOpen = false;
  searchQuery = '';
  searchResults: any[] = [];
  isMobileMenuOpen = false;
  isLoginPage = false;

  navLinks = [
    { path: '/dashboard', label: '📊 Dashboard', module: 'dashboard' },
    { path: '/sabhas', label: '🗓️ Sabha History', module: 'sabha_history' },
    { path: '/members', label: '👥 Member Registry', module: 'members' },
    { path: '/roles', label: '🛡️ System Roles', module: 'roles' },
    { path: '/attendance', label: '📝 Attendance', module: 'attendance' },
    { path: '/wallet', label: '💳 Financials', module: 'financials' },
    { path: '/reports', label: '📈 Reports', module: 'reports' }
  ];

  get filteredNavLinks() {
    return this.navLinks.filter(link => this.auth.hasPermission(link.module, 'view'));
  }

  private searchSubject = new Subject<string>();

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginPage = event.url.includes('/login') || event.url === '/' || event.urlAfterRedirects?.includes('/login');
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.executeSearch(query);
    });

    // Voice Assistant Subscriptions
    this.voiceAssistant.listening$.subscribe(listening => {
      this.isListening = listening;
    });

    this.voiceAssistant.transcript$.subscribe(text => {
      this.currentTranscript = text;
    });

    this.voiceAssistant.command$.subscribe(command => {
      this.handleVoiceCommand(command);
    });
  }

  private handleVoiceCommand(command: string) {
    if (command.includes('attendance')) {
      this.navigateTo('/attendance');
    } else if (command.includes('member')) {
      this.navigateTo('/members');
    } else if (command.includes('dashboard')) {
      this.navigateTo('/dashboard');
    } else if (command.includes('sabha')) {
      this.navigateTo('/sabhas');
    } else if (command.includes('role')) {
      this.navigateTo('/roles');
    } else if (command.includes('financial') || command.includes('wallet')) {
      this.navigateTo('/wallet');
    } else if (command.includes('report')) {
      this.navigateTo('/reports');
    } else if (command.includes('stop') || command.includes('close')) {
      this.closeVoiceAssistant();
    }
  }

  toggleVoiceAssistant() {
    this.isVoiceActive = !this.isVoiceActive;
    if (this.isVoiceActive) {
      this.voiceAssistant.startListening();
      this.currentTranscript = 'Listening... Say something like "Go to Attendance"';
    } else {
      this.voiceAssistant.stopListening();
    }
  }

  closeVoiceAssistant() {
    this.isVoiceActive = false;
    this.voiceAssistant.stopListening();
  }

  ngOnInit() {
    // Initial check for login page to avoid sidebar flicker
    const currentUrl = window.location.pathname;
    this.isLoginPage = currentUrl.includes('/login') || currentUrl === '/';

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          if (confirm('A new version is available. Load New Version?')) {
            window.location.reload();
          }
        }
      });
    }
  }

  @ViewChild('searchInput') searchInputElement!: ElementRef;

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
    if (event.key === 'Escape' && this.isSearchOpen) {
      this.closeSearch();
    }
  }

  openSearch() {
    this.isSearchOpen = true;
    this.searchQuery = '';
    this.searchResults = [];
    setTimeout(() => {
      this.searchInputElement?.nativeElement.focus();
    }, 100);
  }

  closeSearch() {
    this.isSearchOpen = false;
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  async executeSearch(searchQuery: string) {
    if (searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    try {
      const query = searchQuery.toLowerCase();
      
      // Parallel search for speed
      const [membersRes, sabhasRes] = await Promise.all([
        this.supabase.client.from('members')
          .select('id, name, contact_details, email_id')
          .or(`name.ilike.%${query}%,contact_details.ilike.%${query}%,email_id.ilike.%${query}%`)
          .limit(5),
        this.supabase.client.from('sabhas')
          .select('id, title, sabha_type')
          .ilike('title', `%${query}%`)
          .limit(5)
      ]);

      const results: any[] = [];
      
      if (membersRes.data) {
        membersRes.data.forEach((m: any) => results.push({
          title: m.name,
          subtitle: `Member • ${m.contact_details}`,
          icon: '👥',
          link: '/members'
        }));
      }

      if (sabhasRes.data) {
        sabhasRes.data.forEach((s: any) => results.push({
          title: s.title,
          subtitle: `Sabha • ${s.sabha_type}`,
          icon: '📅',
          link: '/sabhas'
        }));
      }

      this.searchResults = results;
    } catch (e) {
      console.error('Search error:', e);
    }
  }

  navigateTo(path: string) {
    this.closeSearch();
    this.closeMobileMenu();
    this.router.navigate([path]);
  }

  logout() {
    this.closeMobileMenu();
    this.auth.logout();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
