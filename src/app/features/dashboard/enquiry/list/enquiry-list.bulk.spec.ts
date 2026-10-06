import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { EnquiryList } from './enquiry-list';

const row = (id: string, name: string) => ({
  _id: id,
  name,
  phone: `98765${id}`,
  source: 'website',
  status: 'new',
  notes: [],
  createdAt: '2026-10-05T09:00:00.000Z',
});

const ROWS = [row('1', 'Alpha'), row('2', 'Bravo'), row('3', 'Charlie')];
const SALES = { _id: 's1', firstName: 'Sam', lastName: 'Sales', email: 's@x.com', role: 'sales', status: 'active' };

function setup(role: 'admin' | 'sales', total = 3) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: AuthService,
        useValue: { isAdmin: () => role === 'admin', role: () => role, hasRole: (...r: string[]) => r.includes(role) },
      },
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(EnquiryList);
  fixture.detectChanges();

  // The constructor fires: the page of leads, the stat cards, and (admins only) the assignee list.
  http.expectOne((r) => r.url.endsWith('/enquiries') || r.url.includes('/enquiries?')).flush({
    success: true,
    data: ROWS,
    meta: { page: 1, limit: 10, total, totalPages: 1 },
  });
  http.expectOne((r) => r.url.includes('/enquiries/stats')).flush({
    success: true,
    data: { total, byStatus: {}, bySource: {}, followUps: { overdue: 0, today: 0, upcoming: 0 } },
  });
  if (role === 'admin') {
    http.expectOne((r) => r.url.endsWith('/users')).flush({ success: true, data: [SALES] });
  }
  fixture.detectChanges();

  const el = fixture.nativeElement as HTMLElement;
  const checkboxes = () => Array.from(el.querySelectorAll('tbody input[type="checkbox"]')) as HTMLInputElement[];
  const headerBox = () => el.querySelector('thead input[type="checkbox"]') as HTMLInputElement | null;
  const bar = () => el.querySelector('[aria-label="Bulk actions"]') as HTMLElement | null;
  const click = (target: Element | null | undefined) => {
    (target as HTMLElement).click();
    fixture.detectChanges();
  };
  return { http, fixture, el, checkboxes, headerBox, bar, click };
}

describe('Enquiry list — bulk assignment (admin)', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows no checkboxes and no bulk bar to non-admins', () => {
    const { checkboxes, headerBox, bar } = setup('sales');
    expect(checkboxes()).toHaveLength(0);
    expect(headerBox()).toBeNull();
    expect(bar()).toBeNull();
  });

  it('an admin gets a checkbox per row plus a select-all, and no bar until something is ticked', () => {
    const { checkboxes, headerBox, bar } = setup('admin');
    expect(checkboxes()).toHaveLength(3);
    expect(headerBox()).not.toBeNull();
    expect(bar()).toBeNull();
  });

  it('ticking rows shows the bar with a live count', () => {
    const { checkboxes, bar, click } = setup('admin');
    click(checkboxes()[0]);
    expect(bar()?.textContent).toContain('1 selected');
    click(checkboxes()[2]);
    expect(bar()?.textContent).toContain('2 selected');
    click(checkboxes()[0]);
    expect(bar()?.textContent).toContain('1 selected');
  });

  it('select-all ticks every row on the page, and clicking it again clears them', () => {
    const { checkboxes, headerBox, bar, click } = setup('admin');
    click(headerBox());
    expect(checkboxes().every((c) => c.checked)).toBe(true);
    expect(bar()?.textContent).toContain('3 selected');
    click(headerBox());
    expect(bar()).toBeNull();
  });

  it('unticking a row un-ticks the select-all', () => {
    const { checkboxes, headerBox, click } = setup('admin');
    click(headerBox());
    click(checkboxes()[1]);
    expect(headerBox()?.checked).toBe(false);
  });

  it('warns that only the current page is selected when there are more leads than fit on it', () => {
    const { headerBox, bar, click } = setup('admin', 250);
    click(headerBox());
    expect(bar()?.textContent).toContain('Only the 3 leads on this page are selected');
  });

  it('sends exactly the ticked ids and the chosen assignee, then refreshes the same page and clears the selection', () => {
    const { http, fixture, el, checkboxes, bar, click } = setup('admin');
    click(checkboxes()[0]);
    click(checkboxes()[2]);

    const select = bar()!.querySelector('select') as HTMLSelectElement;
    select.value = select.querySelector('option[value="s1"]')!.getAttribute('value')!;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    click(Array.from(bar()!.querySelectorAll('button')).find((b) => b.textContent?.includes('Assign selected')));

    const post = http.expectOne((r) => r.url.endsWith('/enquiries/bulk-assign'));
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ ids: ['1', '3'], assignedTo: 's1' });
    post.flush({ success: true, data: { updated: 2, unchanged: 0, notFound: 0 } });

    // Same page is reloaded (not reset), and counts are refreshed.
    const reload = http.expectOne((r) => r.url.includes('/enquiries?') && new URL(r.url).searchParams.get('page') === '1');
    reload.flush({ success: true, data: ROWS, meta: { page: 1, limit: 10, total: 3, totalPages: 1 } });
    http.expectOne((r) => r.url.includes('/enquiries/stats')).flush({
      success: true,
      data: { total: 3, byStatus: {}, bySource: {}, followUps: { overdue: 0, today: 0, upcoming: 0 } },
    });
    fixture.detectChanges();

    expect(el.textContent).toContain('2 lead(s) assigned to Sam Sales');
    expect(bar()).toBeNull();
    expect(checkboxes().some((c) => c.checked)).toBe(false);
  });

  it('"Unassigned" sends assignedTo: null', () => {
    const { http, checkboxes, bar, click } = setup('admin');
    click(checkboxes()[1]);
    click(Array.from(bar()!.querySelectorAll('button')).find((b) => b.textContent?.includes('Assign selected')));

    const post = http.expectOne((r) => r.url.endsWith('/enquiries/bulk-assign'));
    expect(post.request.body).toEqual({ ids: ['2'], assignedTo: null });
    post.flush({ success: false }, { status: 500, statusText: 'x' });
  });

  it('keeps the selection and shows the error when the request fails', () => {
    const { http, fixture, el, checkboxes, bar, click } = setup('admin');
    click(checkboxes()[0]);
    click(Array.from(bar()!.querySelectorAll('button')).find((b) => b.textContent?.includes('Assign selected')));

    http
      .expectOne((r) => r.url.endsWith('/enquiries/bulk-assign'))
      .flush({ success: false, message: 'Leads can only be assigned to an active user' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(el.textContent).toContain('Leads can only be assigned to an active user');
    expect(bar()?.textContent).toContain('1 selected');
  });

  it('Clear selection empties it without sending anything', () => {
    const { checkboxes, bar, click } = setup('admin');
    click(checkboxes()[0]);
    click(Array.from(bar()!.querySelectorAll('button')).find((b) => b.textContent?.includes('Clear selection')));
    expect(bar()).toBeNull();
  });
});
