import { Component, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../../../shared/components/icon/icon';

type Section = 'site' | 'blog' | 'users' | 'products' | 'enquiries' | 'contacts' | 'whatsapp';

interface RailItem {
  label: string;
  icon: string;
  section: Section;
}

interface NavItem {
  label: string;
  route?: string;
  icon: string;
}

const SITE_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'home' },
  { label: 'Hosting Plan', icon: 'server' },
  { label: 'Performance', icon: 'gauge' },
  { label: 'Analytics', icon: 'chart' },
  { label: 'Security', icon: 'shield' },
  { label: 'Domains', icon: 'globe' },
  { label: 'Website', icon: 'window' },
  { label: 'Files', icon: 'folder' },
  { label: 'Databases', icon: 'database' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const BLOG_NAV: NavItem[] = [
  { label: 'All blogs', route: '/dashboard/blog', icon: 'blog' },
  { label: 'New post', route: '/dashboard/blog/new', icon: 'plus' },
  { label: 'Blog analytics', route: '/dashboard/blog/analytics', icon: 'trending' },
  { label: 'Categories & tags', icon: 'tag' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const USERS_NAV: NavItem[] = [
  { label: 'All users', route: '/dashboard/users', icon: 'users' },
  { label: 'Add user', route: '/dashboard/users/new', icon: 'plus' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const PRODUCTS_NAV: NavItem[] = [
  { label: 'All products', route: '/dashboard/products', icon: 'bag' },
  { label: 'New product', route: '/dashboard/products/new', icon: 'plus' },
  { label: 'Categories', route: '/dashboard/categories', icon: 'layers' },
  { label: 'New category', route: '/dashboard/categories/new', icon: 'plus' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const ENQUIRIES_NAV: NavItem[] = [
  { label: 'All enquiries', route: '/dashboard/enquiries', icon: 'inbox' },
  { label: 'Add lead', route: '/dashboard/enquiries/new', icon: 'plus' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const CONTACTS_NAV: NavItem[] = [
  { label: 'All submissions', route: '/dashboard/contacts', icon: 'mail' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const WHATSAPP_NAV: NavItem[] = [
  { label: 'Inbox', route: '/dashboard/whatsapp', icon: 'message-circle' },
  { label: 'Broadcast', route: '/dashboard/whatsapp/broadcast', icon: 'send' },
  { label: 'Templates', route: '/dashboard/whatsapp/templates', icon: 'tag' },
  { label: 'Settings', route: '/dashboard/settings', icon: 'settings' },
];

const SECTION_ROOT: Record<Exclude<Section, 'site'>, string> = {
  blog: '/dashboard/blog',
  users: '/dashboard/users',
  products: '/dashboard/products',
  enquiries: '/dashboard/enquiries',
  contacts: '/dashboard/contacts',
  whatsapp: '/dashboard/whatsapp',
};

const SECTION_NAV: Record<Section, NavItem[]> = {
  site: SITE_NAV,
  blog: BLOG_NAV,
  users: USERS_NAV,
  products: PRODUCTS_NAV,
  enquiries: ENQUIRIES_NAV,
  contacts: CONTACTS_NAV,
  whatsapp: WHATSAPP_NAV,
};

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, UpperCasePipe],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly userMenuOpen = signal(false);

  readonly railItems: RailItem[] = [
    { label: 'WhatsApp', icon: 'message-circle', section: 'whatsapp' },
    { label: 'Products', icon: 'bag', section: 'products' },
    { label: 'Enquiries', icon: 'inbox', section: 'enquiries' },
    { label: 'Contacts', icon: 'mail', section: 'contacts' },
    { label: 'Blog', icon: 'blog', section: 'blog' },
    { label: 'Users', icon: 'users', section: 'users' },
    { label: 'More services', icon: 'grid', section: 'site' },
    { label: 'AI Builder', icon: 'cpu', section: 'site' },
    { label: 'Marketing', icon: 'megaphone', section: 'site' },
    { label: 'Ecomm', icon: 'bag', section: 'site' },
  ];

  private readonly url = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
    { initialValue: null }
  );

  /** Which sidebar section is active — derived from the current URL so a refresh on
   *  /dashboard/blog or /dashboard/users still shows the right nav, not just the last rail click. */
  readonly activeSection = computed<Section>(() => {
    this.url();
    const path = this.router.url;
    if (path.startsWith('/dashboard/blog')) return 'blog';
    if (path.startsWith('/dashboard/users')) return 'users';
    if (path.startsWith('/dashboard/products') || path.startsWith('/dashboard/categories')) return 'products';
    if (path.startsWith('/dashboard/enquiries')) return 'enquiries';
    if (path.startsWith('/dashboard/contacts')) return 'contacts';
    if (path.startsWith('/dashboard/whatsapp')) return 'whatsapp';
    return 'site';
  });

  readonly navItems = computed<NavItem[]>(() => SECTION_NAV[this.activeSection()]);

  selectSection(item: RailItem): void {
    const root = item.section === 'site' ? '/dashboard' : SECTION_ROOT[item.section];
    this.router.navigate([root]);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearUser();
        this.router.navigate(['/login']);
      },
    });
  }
}
