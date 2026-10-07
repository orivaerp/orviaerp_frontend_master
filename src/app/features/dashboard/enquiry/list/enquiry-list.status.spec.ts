import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { EnquiryList } from './enquiry-list';

function render() {
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
    data: [
      {
        _id: '1',
        name: 'Keen Kiran',
        phone: '9000000011',
        source: 'website',
        status: 'interested',
        notes: [],
        createdAt: '2026-10-07T09:00:00.000Z',
      },
    ],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  });
  http.expectOne((r) => r.url.includes('/enquiries/stats')).flush({
    success: true,
    data: {
      total: 4,
      byStatus: { new: 1, contacted: 1, interested: 2, 'in-progress': 0, converted: 0, lost: 0, wrong: 0, closed: 0 },
      bySource: {},
    },
  });
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Enquiry list — "Interested" status', () => {
  it('adds an Interested filter pill, between Contacted and In progress', () => {
    const el = render();
    const pills = Array.from(el.querySelectorAll('button.rounded-full'))
      .map((b) => b.textContent?.trim())
      .filter((t) => ['All', 'New', 'Contacted', 'Interested', 'In progress', 'Converted', 'Lost', 'Wrong', 'Closed'].includes(t ?? ''));
    expect(pills).toEqual(['All', 'New', 'Contacted', 'Interested', 'In progress', 'Converted', 'Lost', 'Wrong', 'Closed']);
  });

  it('shows an Interested stat card with its count (Total + 8 statuses = 9 cards)', () => {
    const el = render();
    const strip = el.querySelector('div.lg\\:grid-cols-9') as HTMLElement;
    expect(strip.children).toHaveLength(9);

    const card = Array.from(strip.children).find((c) => c.textContent?.includes('Interested'));
    expect(card?.textContent).toContain('2');
  });

  it('renders an Interested lead with the sky badge', () => {
    const el = render();
    const badge = Array.from(el.querySelectorAll('table span')).find((s) => s.textContent?.trim() === 'Interested');
    expect(badge?.className).toContain('bg-sky-50');
    expect(badge?.className).toContain('text-sky-700');
  });
});
