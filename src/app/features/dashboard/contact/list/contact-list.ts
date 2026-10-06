import { Pagination } from '../../../../shared/components/pagination/pagination';
import { DEFAULT_PAGE_SIZE, PageMeta } from '../../../../core/models/pagination.model';
import { Component, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService } from '../../../../core/services/contact.service';
import {
  CONTACT_SERVICE_OPTIONS,
  CONTACT_STATUSES,
  ContactService as ContactServiceType,
  ContactStats,
  ContactStatus,
  ContactSubmission,
  serviceLabel,
} from '../../../../core/models/contact.model';

interface StatusOption {
  label: string;
  value: ContactStatus | '';
}

function formatStatusLabel(status: ContactStatus): string {
  return status
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: 'All', value: '' },
  ...CONTACT_STATUSES.map((s) => ({ label: formatStatusLabel(s), value: s })),
];

const STATUS_BADGE_CLASS: Record<ContactStatus, string> = {
  new: 'badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)]',
  contacted: 'badge bg-amber-50 text-amber-700',
  'in-progress': 'badge bg-amber-50 text-amber-700',
  converted: 'badge-success',
  lost: 'badge bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  closed: 'badge bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
};

@Component({
  selector: 'app-contact-list',
  imports: [Pagination, RouterLink, SlicePipe, FormsModule],
  templateUrl: './contact-list.html',
})
export class ContactList {
  private readonly contactService = inject(ContactService);

  readonly statusOptions = STATUS_OPTIONS;
  readonly services = CONTACT_SERVICE_OPTIONS;
  readonly label = serviceLabel;
  readonly statusLabel = formatStatusLabel;

  readonly submissions = signal<ContactSubmission[]>([]);
  readonly stats = signal<ContactStats | null>(null);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly meta = signal<PageMeta | null>(null);
  readonly errorMessage = signal('');

  readonly statusFilter = signal<ContactStatus | ''>('');
  readonly serviceFilter = signal<ContactServiceType | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly search = signal('');

  readonly exporting = signal(false);

  constructor() {
    this.reload();
  }

  private currentFilter() {
    return {
      status: this.statusFilter(),
      service: this.serviceFilter(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      search: this.search(),
    };
  }

  /** Filters changed (or first load): back to page 1, and refresh the stat cards. */
  private reload(): void {
    this.page.set(1);
    this.loadPage();

    this.contactService.getStats(this.currentFilter()).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });
  }

  private loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.contactService.getAll(this.currentFilter(), { page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        const meta = res.meta ?? null;
        // The page we asked for is past the end (rows were removed elsewhere) — step back.
        if (meta && res.data.length === 0 && this.page() > 1) {
          this.page.set(meta.totalPages);
          this.loadPage();
          return;
        }
        this.submissions.set(res.data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load contact submissions');
        this.loading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadPage();
  }

  changePageSize(limit: number): void {
    this.limit.set(limit);
    this.page.set(1);
    this.loadPage();
  }

  setStatusFilter(status: ContactStatus | ''): void {
    this.statusFilter.set(status);
    this.reload();
  }

  applyFilters(): void {
    this.reload();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.serviceFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.search.set('');
    this.reload();
  }

  statusBadgeClass(status: ContactStatus): string {
    return STATUS_BADGE_CLASS[status];
  }

  statCount(status: ContactStatus | ''): number {
    if (!status) return 0;
    return this.stats()?.byStatus[status] ?? 0;
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.contactService.exportCsv(this.currentFilter()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contact-submissions-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.exporting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not export submissions');
      },
    });
  }
}
