import { Component, computed, input, output } from '@angular/core';
import { PAGE_SIZE_OPTIONS, PageMeta } from '../../../core/models/pagination.model';
import { Icon } from '../icon/icon';

/** Page numbers to render: first, last, and a window around the current page, with '…' gaps. */
export function pageWindow(current: number, total: number): (number | '…')[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | '…')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

@Component({
  selector: 'app-pagination',
  imports: [Icon],
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly meta = input<PageMeta | null>(null);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly limitChange = output<number>();

  readonly pageSizes = PAGE_SIZE_OPTIONS;

  readonly pages = computed(() => {
    const meta = this.meta();
    return meta ? pageWindow(meta.page, meta.totalPages) : [];
  });
  readonly from = computed(() => {
    const meta = this.meta();
    return meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  });
  readonly to = computed(() => {
    const meta = this.meta();
    return meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
  });

  go(page: number): void {
    const meta = this.meta();
    if (!meta || this.disabled() || page < 1 || page > meta.totalPages || page === meta.page) return;
    this.pageChange.emit(page);
  }

  setLimit(value: string): void {
    this.limitChange.emit(Number(value));
  }
}
