import { Component, inject, HostListener, ViewChild, ElementRef, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { SupabaseService } from './services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';

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
  
  title = 'Sabha Management System';

  isSearchOpen = false;
  searchQuery = '';
  searchResults: any[] = [];
  isMobileMenuOpen = false;
  isLoginPage = false;

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

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
