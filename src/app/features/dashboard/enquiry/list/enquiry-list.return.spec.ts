import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { EnquiryDetail } from '../detail/enquiry-detail';
import { EnquiryList } from './enquiry-list';
import { EnquiryListState } from './enquiry-list-state';

const row = (n: number) => ({
  _id: String(n),
  name: `Lead ${n}`,
  phone: `98765000${n}`,
  source: 'website',
  status: 'new',
  notes: [],
  createdAt: '2026-10-07T09:00:00.000Z',
});

const stats = { success: true, data: { total: 90, byStatus: {}, bySource: {} } };

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { isAdmin: () => false, role: () => 'sales' } },
    ],
  });
  return { http: TestBed.inject(HttpTestingController), router: TestBed.inject(Router) };
}

const listRequest = (http: HttpTestingController) =>
  http.expectOne((r) => r.url.includes('/enquiries?') && !r.url.includes('/stats'));
const queryOf = (url: string) => new URL(url).searchParams;

describe('Enquiry list — remembers where you were', () => {
  it('opens on the page and filters that are in the URL, not page 1', async () => {
    const { http, router } = setup();
    await router.navigateByUrl('/?page=5&limit=25&status=interested&search=patna');

    const fixture = TestBed.createComponent(EnquiryList);
    fixture.detectChanges();

    const req = listRequest(http);
    const q = queryOf(req.request.url);
    expect(q.get('page')).toBe('5');
    expect(q.get('limit')).toBe('25');
    expect(q.get('status')).toBe('interested');
    expect(q.get('search')).toBe('patna');
    req.flush({ success: true, data: [row(1)], meta: { page: 5, limit: 25, total: 110, totalPages: 5 } });
    http.expectOne((r) => r.url.includes('/enquiries/stats')).flush(stats);
    http.verify();
  });

  it('still opens on page 1 with a clean URL when nothing is saved', async () => {
    const { http, router } = setup();
    await router.navigateByUrl('/');

    const fixture = TestBed.createComponent(EnquiryList);
    fixture.detectChanges();

    const req = listRequest(http);
    expect(queryOf(req.request.url).get('page')).toBe('1');
    req.flush({ success: true, data: [row(1)], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } });
    http.expectOne((r) => r.url.includes('/enquiries/stats')).flush(stats);
    await fixture.whenStable();
    expect(router.url).toBe('/');
  });

  it('writes the page into the URL as you page through, so Back brings you to it', async () => {
    const { http, router } = setup();
    await router.navigateByUrl('/');
    const fixture = TestBed.createComponent(EnquiryList);
    fixture.detectChanges();

    listRequest(http).flush({ success: true, data: [row(1)], meta: { page: 1, limit: 10, total: 90, totalPages: 9 } });
    http.expectOne((r) => r.url.includes('/enquiries/stats')).flush(stats);

    fixture.componentInstance.goToPage(5);
    listRequest(http).flush({ success: true, data: [row(41)], meta: { page: 5, limit: 10, total: 90, totalPages: 9 } });
    await fixture.whenStable();

    expect(router.url).toBe('/?page=5');
    expect(TestBed.inject(EnquiryListState).params()).toEqual({ page: '5' });
  });

  it('changing a filter resets to page 1 and records the filter in the URL', async () => {
    const { http, router } = setup();
    await router.navigateByUrl('/?page=4');
    const fixture = TestBed.createComponent(EnquiryList);
    fixture.detectChanges();
    listRequest(http).flush({ success: true, data: [row(31)], meta: { page: 4, limit: 10, total: 90, totalPages: 9 } });
    http.expectOne((r) => r.url.includes('/enquiries/stats')).flush(stats);

    fixture.componentInstance.setStatusFilter('contacted');
    const req = listRequest(http);
    expect(queryOf(req.request.url).get('page')).toBe('1');
    expect(queryOf(req.request.url).get('status')).toBe('contacted');
    req.flush({ success: true, data: [row(1)], meta: { page: 1, limit: 10, total: 12, totalPages: 2 } });
    http.expectOne((r) => r.url.includes('/enquiries/stats')).flush(stats);
    await fixture.whenStable();

    expect(router.url).toBe('/?status=contacted');
  });

  it('the lead page\'s "Back to enquiries" link returns to the saved page and filters', async () => {
    const { http } = setup();
    TestBed.inject(EnquiryListState).params.set({ page: '5', status: 'interested' });

    const fixture = TestBed.createComponent(EnquiryDetail);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/enquiries/')).flush({ success: true, data: { ...row(1), activities: [] } });
    fixture.detectChanges();

    const back = (fixture.nativeElement as HTMLElement).querySelector('a[href^="/dashboard/enquiries"]');
    expect(back?.getAttribute('href')).toBe('/dashboard/enquiries?page=5&status=interested');
  });
});
