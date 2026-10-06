import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PageMeta } from '../../../core/models/pagination.model';
import { Pagination, pageWindow } from './pagination';

function render(meta: PageMeta | null) {
  const fixture = TestBed.createComponent(Pagination);
  fixture.componentRef.setInput('meta', meta);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const emitted = { page: [] as number[], limit: [] as number[] };
  fixture.componentInstance.pageChange.subscribe((p) => emitted.page.push(p));
  fixture.componentInstance.limitChange.subscribe((l) => emitted.limit.push(l));
  const buttons = () => Array.from(el.querySelectorAll('nav button')) as HTMLButtonElement[];
  const byText = (text: string) => buttons().find((b) => b.textContent?.trim() === text);
  return { fixture, el, emitted, buttons, byText };
}

const meta = (page: number, total: number, limit = 10): PageMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('collapses distant pages into an ellipsis around the current page', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, '…', 20]);
    expect(pageWindow(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
    expect(pageWindow(20, 20)).toEqual([1, '…', 19, 20]);
  });

  it('does not add an ellipsis where there is no gap', () => {
    expect(pageWindow(3, 6)).toEqual([1, 2, 3, 4, '…', 6]);
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, '…', 5]);
  });
});

describe('Pagination component', () => {
  it('renders nothing without meta (e.g. an older server that does not paginate)', () => {
    const { el } = render(null);
    expect(el.textContent?.trim()).toBe('');
  });

  it('shows the visible range and total', () => {
    const { el } = render(meta(2, 53));
    expect(el.textContent).toContain('11–20');
    expect(el.textContent).toContain('53');
  });

  it('clamps the range on the last, partial page', () => {
    const { el } = render(meta(6, 53));
    expect(el.textContent).toContain('51–53');
  });

  it('says "No results" for an empty set and hides the page buttons', () => {
    const { el, buttons } = render(meta(1, 0));
    expect(el.textContent).toContain('No results');
    expect(buttons()).toHaveLength(0);
  });

  it('hides the page buttons when everything fits on one page but keeps the page-size picker', () => {
    const { el, buttons } = render(meta(1, 7));
    expect(el.textContent).toContain('1–7');
    expect(buttons()).toHaveLength(0);
    expect(el.querySelector('select')).not.toBeNull();
  });

  it('emits the clicked page number', () => {
    const { byText, emitted } = render(meta(2, 100));
    byText('10')?.click();
    byText('3')?.click();
    expect(emitted.page).toEqual([10, 3]);
  });

  it('previous / next move one page', () => {
    const { el, emitted } = render(meta(3, 100));
    (el.querySelector('[aria-label="Previous page"]') as HTMLButtonElement).click();
    (el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click();
    expect(emitted.page).toEqual([2, 4]);
  });

  it('disables previous on the first page and next on the last', () => {
    const first = render(meta(1, 100));
    expect((first.el.querySelector('[aria-label="Previous page"]') as HTMLButtonElement).disabled).toBe(true);
    expect((first.el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).disabled).toBe(false);

    const last = render(meta(10, 100));
    expect((last.el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not emit when the current page is clicked', () => {
    const { byText, emitted } = render(meta(4, 100));
    byText('4')?.click();
    expect(emitted.page).toEqual([]);
  });

  it('marks the current page for assistive tech', () => {
    const { byText } = render(meta(4, 100));
    expect(byText('4')?.getAttribute('aria-current')).toBe('page');
    expect(byText('3')?.getAttribute('aria-current')).toBeNull();
  });

  it('emits the chosen page size as a number', () => {
    const { el, emitted } = render(meta(1, 100));
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    expect(emitted.limit).toEqual([50]);
  });

  it('ignores clicks while disabled (a request is in flight)', () => {
    const { fixture, el, emitted } = render(meta(2, 100));
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    (el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click();
    expect(emitted.page).toEqual([]);
  });
});
