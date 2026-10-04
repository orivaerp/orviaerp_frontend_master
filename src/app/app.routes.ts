import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password/:token',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/public/contact/contact-page').then((m) => m.ContactPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout').then((m) => m.DashboardLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/home/dashboard-home').then((m) => m.DashboardHome),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/dashboard/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/dashboard/blog/list/blog-list').then((m) => m.BlogList),
      },
      {
        path: 'blog/new',
        loadComponent: () => import('./features/dashboard/blog/create/blog-create').then((m) => m.BlogCreate),
      },
      {
        path: 'blog/analytics',
        loadComponent: () =>
          import('./features/dashboard/blog/analytics/blog-analytics').then((m) => m.BlogAnalytics),
      },
      {
        path: 'blog/:id',
        loadComponent: () =>
          import('./features/dashboard/blog/detail/blog-detail').then((m) => m.BlogDetail),
      },
      {
        path: 'blog/:id/edit',
        loadComponent: () => import('./features/dashboard/blog/edit/blog-edit').then((m) => m.BlogEdit),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/dashboard/users/list/users-list').then((m) => m.UsersList),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./features/dashboard/users/create/user-create').then((m) => m.UserCreate),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/dashboard/users/detail/user-detail').then((m) => m.UserDetail),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/dashboard/category/list/category-list').then((m) => m.CategoryList),
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import('./features/dashboard/category/create/category-create').then((m) => m.CategoryCreate),
      },
      {
        path: 'categories/:id',
        loadComponent: () =>
          import('./features/dashboard/category/detail/category-detail').then((m) => m.CategoryDetail),
      },
      {
        path: 'products',
        loadComponent: () => import('./features/dashboard/product/list/product-list').then((m) => m.ProductList),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/dashboard/product/create/product-create').then((m) => m.ProductCreate),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/dashboard/product/detail/product-detail').then((m) => m.ProductDetail),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/dashboard/product/edit/product-edit').then((m) => m.ProductEdit),
      },
      {
        path: 'enquiries',
        loadComponent: () =>
          import('./features/dashboard/enquiry/list/enquiry-list').then((m) => m.EnquiryList),
      },
      {
        path: 'enquiries/new',
        loadComponent: () =>
          import('./features/dashboard/enquiry/create/enquiry-create').then((m) => m.EnquiryCreate),
      },
      {
        path: 'enquiries/:id',
        loadComponent: () =>
          import('./features/dashboard/enquiry/detail/enquiry-detail').then((m) => m.EnquiryDetail),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./features/dashboard/contact/list/contact-list').then((m) => m.ContactList),
      },
      {
        path: 'contacts/:id',
        loadComponent: () =>
          import('./features/dashboard/contact/detail/contact-detail').then((m) => m.ContactDetail),
      },
      {
        path: 'whatsapp',
        loadComponent: () =>
          import('./features/dashboard/whatsapp/inbox/whatsapp-inbox').then((m) => m.WhatsappInbox),
      },
      {
        path: 'whatsapp/templates',
        loadComponent: () =>
          import('./features/dashboard/whatsapp/templates/whatsapp-templates').then(
            (m) => m.WhatsappTemplates
          ),
      },
      {
        path: 'whatsapp/broadcast',
        loadComponent: () =>
          import('./features/dashboard/whatsapp/broadcast/whatsapp-broadcast').then(
            (m) => m.WhatsappBroadcast
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
