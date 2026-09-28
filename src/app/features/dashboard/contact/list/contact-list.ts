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
  imports: [RouterLink, SlicePipe, FormsModule],
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
  readonly errorMessage = signal('');

  readonly statusFilter = signal<ContactStatus | ''>('');
  readonly serviceFilter = signal<ContactServiceType | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly search = signal('');

  readonly exporting = signal(false);

  constructor() {
    this.load();
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

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const filter = this.currentFilter();

    this.contactService.getAll(filter).subscribe({
      next: (res) => {
        this.submissions.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load contact submissions');
        this.loading.set(false);
      },
    });

    this.contactService.getStats(filter).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });
  }

  setStatusFilter(status: ContactStatus | ''): void {
    this.statusFilter.set(status);
    this.load();
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.serviceFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.search.set('');
    this.load();
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
