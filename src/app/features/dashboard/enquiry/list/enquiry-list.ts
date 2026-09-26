import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EnquiryService, ImportResult } from '../../../../core/services/enquiry.service';
import {
  ENQUIRY_CATEGORIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  Enquiry,
  EnquiryCategory,
  EnquirySource,
  EnquiryStats,
  EnquiryStatus,
} from '../../../../core/models/enquiry.model';
import { formatEnumLabel } from '../../../../shared/utils/format-label';

interface StatusOption {
  label: string;
  value: EnquiryStatus | '';
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: 'All', value: '' },
  ...ENQUIRY_STATUSES.map((s) => ({ label: formatEnumLabel(s), value: s })),
];

const STATUS_BADGE_CLASS: Record<EnquiryStatus, string> = {
  new: 'badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)]',
  contacted: 'badge bg-amber-50 text-amber-700',
  'in-progress': 'badge bg-amber-50 text-amber-700',
  converted: 'badge-success',
  lost: 'badge bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  wrong: 'badge bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  closed: 'badge bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
};

@Component({
  selector: 'app-enquiry-list',
  imports: [RouterLink, SlicePipe, FormsModule],
  templateUrl: './enquiry-list.html',
})
export class EnquiryList {
  private readonly enquiryService = inject(EnquiryService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly statusOptions = STATUS_OPTIONS;
  readonly sources = ENQUIRY_SOURCES;
  readonly categories = ENQUIRY_CATEGORIES;
  readonly label = formatEnumLabel;

  readonly enquiries = signal<Enquiry[]>([]);
  readonly stats = signal<EnquiryStats | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly statusFilter = signal<EnquiryStatus | ''>('');
  readonly sourceFilter = signal<EnquirySource | ''>('');
  readonly categoryFilter = signal<EnquiryCategory | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly search = signal('');

  readonly exporting = signal(false);
  readonly importing = signal(false);
  readonly importResult = signal<ImportResult | null>(null);

  constructor() {
    this.load();
  }

  private currentFilter() {
    return {
      status: this.statusFilter(),
      source: this.sourceFilter(),
      category: this.categoryFilter(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      search: this.search(),
    };
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const filter = this.currentFilter();

    this.enquiryService.getAll(filter).subscribe({
      next: (res) => {
        this.enquiries.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load enquiries');
        this.loading.set(false);
      },
    });

    this.enquiryService.getStats(filter).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });
  }

  setStatusFilter(status: EnquiryStatus | ''): void {
    this.statusFilter.set(status);
    this.load();
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.sourceFilter.set('');
    this.categoryFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.search.set('');
    this.load();
  }

  statusBadgeClass(status: EnquiryStatus): string {
    return STATUS_BADGE_CLASS[status];
  }

  statCount(status: EnquiryStatus | ''): number {
    if (!status) return 0;
    return this.stats()?.byStatus[status] ?? 0;
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.enquiryService.exportCsv(this.currentFilter()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enquiries-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.exporting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not export enquiries');
      },
    });
  }

  triggerImport(): void {
    this.fileInput()?.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importResult.set(null);
    this.errorMessage.set('');

    const reader = new FileReader();
    reader.onload = () => {
      this.enquiryService.importCsv(String(reader.result)).subscribe({
        next: (res) => {
          this.importing.set(false);
          this.importResult.set(res.data);
          this.load();
        },
        error: (err) => {
          this.importing.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not import this CSV');
        },
      });
    };
    reader.readAsText(file);
    input.value = '';
  }
}
