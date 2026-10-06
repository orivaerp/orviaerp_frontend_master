import { Pagination } from '../../../../shared/components/pagination/pagination';
import { DEFAULT_PAGE_SIZE, PageMeta } from '../../../../core/models/pagination.model';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  BulkAssignResult,
  EnquiryService,
  ImportResult,
} from '../../../../core/services/enquiry.service';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { User } from '../../../../core/models/user.model';
import { FollowUpState, followUpState, personName } from '../shared/lead-activity';
import {
  ENQUIRY_CATEGORIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  Enquiry,
  EnquiryCategory,
  EnquirySource,
  EnquiryStats,
  EnquiryStatus,
  FollowUpFilter,
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
  imports: [Pagination, RouterLink, SlicePipe, DatePipe, FormsModule],
  templateUrl: './enquiry-list.html',
})
export class EnquiryList {
  private readonly enquiryService = inject(EnquiryService);
  private readonly userAdminService = inject(UserAdminService);
  readonly authService = inject(AuthService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly statusOptions = STATUS_OPTIONS;
  readonly sources = ENQUIRY_SOURCES;
  readonly categories = ENQUIRY_CATEGORIES;
  readonly label = formatEnumLabel;

  readonly enquiries = signal<Enquiry[]>([]);
  readonly stats = signal<EnquiryStats | null>(null);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly meta = signal<PageMeta | null>(null);
  readonly errorMessage = signal('');

  readonly statusFilter = signal<EnquiryStatus | ''>('');
  readonly sourceFilter = signal<EnquirySource | ''>('');
  readonly categoryFilter = signal<EnquiryCategory | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly search = signal('');
  /** Admin only: a user id or 'unassigned'. */
  readonly assigneeFilter = signal('');
  readonly followUpFilter = signal<FollowUpFilter | ''>('');

  /** Everyone an admin can hand a lead to (loaded for admins only). */
  readonly assignees = signal<User[]>([]);

  // ---- Bulk assignment (admin) ----
  /** Ids ticked on the current page; cleared whenever the list changes. */
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly selectedCount = computed(() => this.selected().size);
  readonly allOnPageSelected = computed(() => {
    const rows = this.enquiries();
    return rows.length > 0 && rows.every((e) => this.selected().has(e._id));
  });
  /** Ticking every row on a page that isn't the whole result set deserves a heads-up. */
  readonly moreThanThisPage = computed(
    () => this.allOnPageSelected() && (this.meta()?.total ?? 0) > this.enquiries().length,
  );
  readonly bulkAssigneeId = signal('');
  readonly bulkAssigning = signal(false);
  readonly bulkResult = signal<{ result: BulkAssignResult; to: string } | null>(null);

  /** Phones only: the filter fields fold away behind a "Filters" button. */
  readonly filtersOpen = signal(false);
  readonly activeFilterCount = computed(
    () =>
      [
        this.sourceFilter(),
        this.categoryFilter(),
        this.assigneeFilter(),
        this.followUpFilter(),
        this.dateFrom(),
        this.dateTo(),
        this.search().trim(),
      ].filter(Boolean).length,
  );

  readonly personName = personName;
  readonly followUpState = followUpState;

  readonly exporting = signal(false);
  readonly importing = signal(false);
  readonly importResult = signal<ImportResult | null>(null);

  constructor() {
    this.reload();

    if (this.authService.isAdmin()) {
      this.userAdminService.getAll().subscribe({
        next: (res) => this.assignees.set(res.data.filter((u) => u.status === 'active')),
        error: () => {},
      });
    }
  }

  private currentFilter() {
    return {
      status: this.statusFilter(),
      source: this.sourceFilter(),
      category: this.categoryFilter(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      search: this.search(),
      assignedTo: this.assigneeFilter(),
      followUp: this.followUpFilter(),
    };
  }

  /** Filters changed (or first load): back to page 1, and refresh the stat cards. */
  private reload(): void {
    this.page.set(1);
    this.loadPage();

    this.enquiryService.getStats(this.currentFilter()).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });
  }

  private loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.enquiryService
      .getAll(this.currentFilter(), { page: this.page(), limit: this.limit() })
      .subscribe({
        next: (res) => {
          const meta = res.meta ?? null;
          // The page we asked for is past the end (rows were removed elsewhere) — step back.
          if (meta && res.data.length === 0 && this.page() > 1) {
            this.page.set(meta.totalPages);
            this.loadPage();
            return;
          }
          this.enquiries.set(res.data);
          this.clearSelection();
          this.meta.set(meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Could not load enquiries');
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

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  toggleRow(id: string): void {
    const next = new Set(this.selected());
    if (!next.delete(id)) next.add(id);
    this.selected.set(next);
  }

  toggleAllOnPage(): void {
    this.selected.set(
      this.allOnPageSelected() ? new Set() : new Set(this.enquiries().map((e) => e._id)),
    );
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  /** Gives every ticked lead to the chosen person (or unassigns them all), then refreshes in place. */
  assignSelected(): void {
    if (!this.authService.isAdmin() || this.bulkAssigning() || this.selectedCount() === 0) return;

    const assigneeId = this.bulkAssigneeId();
    const target = this.assignees().find((u) => u._id === assigneeId);

    this.bulkAssigning.set(true);
    this.errorMessage.set('');
    this.bulkResult.set(null);

    this.enquiryService.bulkAssign([...this.selected()], assigneeId || null).subscribe({
      next: (res) => {
        this.bulkAssigning.set(false);
        this.bulkResult.set({
          result: res.data,
          to: target ? personName(target) : 'nobody (unassigned)',
        });
        this.refreshCurrentPage();
      },
      error: (err) => {
        this.bulkAssigning.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not assign the selected leads');
      },
    });
  }

  /** Reloads the list and counts but stays on the same page (unlike a filter change). */
  private refreshCurrentPage(): void {
    this.loadPage();
    this.enquiryService.getStats(this.currentFilter()).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });
  }

  setStatusFilter(status: EnquiryStatus | ''): void {
    this.statusFilter.set(status);
    this.reload();
  }

  applyFilters(): void {
    this.reload();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.sourceFilter.set('');
    this.categoryFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.search.set('');
    this.assigneeFilter.set('');
    this.followUpFilter.set('');
    this.reload();
  }

  /** Admin-panel user who added the lead, or "Website" for public form submissions. */
  createdByName(enquiry: Enquiry): string {
    const creator = enquiry.createdBy;
    if (!creator || typeof creator === 'string') return 'Website';
    return `${creator.firstName} ${creator.lastName ?? ''}`.trim();
  }

  /** The follow-up stat cards double as quick filters. */
  setFollowUpFilter(kind: FollowUpFilter | ''): void {
    this.followUpFilter.set(this.followUpFilter() === kind ? '' : kind);
    this.reload();
  }

  followUpBadgeClass(state: FollowUpState): string {
    return {
      overdue: 'badge bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
      today: 'badge bg-amber-50 text-amber-700',
      upcoming: 'badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)]',
    }[state];
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
          this.reload();
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
