import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { EnquiryList } from './enquiry-list';

const lead = (id: string, name: string, phone: string) => ({
  _id: id,
  name,
  phone,
  source: 'website',
  status: 'new',
  notes: [],
  createdAt: '2026-10-07T09:00:00.000Z',
});

function render(rows: ReturnType<typeof lead>[]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { isAdmin: () => false, role: () => 'sales' } },
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(EnquiryList);
  fixture.detectChanges();
  http.expectOne((r) => r.url.includes('/enquiries?')).flush({
    success: true,
    data: rows,
    meta: { page: 1, limit: 10, total: rows.length, totalPages: 1 },
  });
  http.expectOne((r) => r.url.includes('/enquiries/stats')).flush({ success: true, data: { total: rows.length, byStatus: {}, bySource: {} } });
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Enquiry list — Call buttons', () => {
  it('dials the cleaned 10-digit number from every stored format, in both the table and the phone cards', () => {
    const el = render([
      lead('1', 'Plus Ninety One', '+91 91557 72255'),
      lead('2', 'Leading Zero', '09155772255'),
      lead('3', 'Country Code', '919155772255'),
    ]);

    const hrefs = (selector: string) =>
      Array.from(el.querySelectorAll(selector)).map((a) => a.getAttribute('href'));

    expect(hrefs('table a[href^="tel:"]')).toEqual(['tel:9155772255', 'tel:9155772255', 'tel:9155772255']);
    expect(hrefs('ul a[href^="tel:"]')).toEqual(['tel:9155772255', 'tel:9155772255', 'tel:9155772255']);
  });

  it('still shows the number exactly as stored', () => {
    const el = render([lead('1', 'Plus Ninety One', '+91 91557 72255')]);
    expect(el.querySelector('table')?.textContent).toContain('+91 91557 72255');
  });

  it('labels each button with the lead it calls', () => {
    const el = render([lead('1', 'Gayatri Tours', '9455007040')]);
    expect(el.querySelector('table a[href^="tel:"]')?.getAttribute('aria-label')).toBe('Call Gayatri Tours');
  });

  it('shows no Call button when the stored number has no digits', () => {
    const el = render([lead('1', 'No Number', 'n/a')]);
    expect(el.querySelectorAll('a[href^="tel:"]')).toHaveLength(0);
  });
});
