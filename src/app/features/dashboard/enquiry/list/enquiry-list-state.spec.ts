import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENQUIRY_LIST_QUERY,
  EnquiryListQuery,
  fromQueryParams,
  sameParams,
  toQueryParams,
} from './enquiry-list-state';

const parse = (params: Record<string, string>) => fromQueryParams(convertToParamMap(params));

describe('enquiry list state <-> URL', () => {
  it('a fresh list has a clean URL', () => {
    expect(toQueryParams(DEFAULT_ENQUIRY_LIST_QUERY)).toEqual({});
  });

  it('leaves defaults out and keeps only what the user changed', () => {
    const query: EnquiryListQuery = { ...DEFAULT_ENQUIRY_LIST_QUERY, page: 5, status: 'interested', search: '  Atal  ' };
    expect(toQueryParams(query)).toEqual({ page: '5', status: 'interested', search: 'Atal' });
  });

  it('page 1 and the default page size are not written to the URL', () => {
    expect(toQueryParams({ ...DEFAULT_ENQUIRY_LIST_QUERY, page: 1, limit: 10 })).toEqual({});
    expect(toQueryParams({ ...DEFAULT_ENQUIRY_LIST_QUERY, limit: 50 })).toEqual({ limit: '50' });
  });

  it('round-trips a fully-loaded filter set', () => {
    const query: EnquiryListQuery = {
      page: 5,
      limit: 25,
      status: 'contacted',
      source: 'campaign',
      category: 'transport',
      assignedTo: '507f1f77bcf86cd799439011',
      followUp: 'overdue',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      search: 'patna',
    };
    const params = toQueryParams(query) as Record<string, string>;
    expect(parse(params)).toEqual(query);
  });

  it('accepts the "unassigned" pool as an assignee filter', () => {
    expect(parse({ assignedTo: 'unassigned' }).assignedTo).toBe('unassigned');
  });

  it('falls back to defaults for missing or hand-edited garbage', () => {
    expect(parse({})).toEqual(DEFAULT_ENQUIRY_LIST_QUERY);
    expect(
      parse({
        page: '-3',
        limit: '7',
        status: 'bogus',
        source: 'nope',
        category: 'x',
        followUp: 'later',
        assignedTo: 'not-an-id',
        dateFrom: '05/10/2026',
        dateTo: 'tomorrow',
      }),
    ).toEqual(DEFAULT_ENQUIRY_LIST_QUERY);
    expect(parse({ page: 'abc' }).page).toBe(1);
    expect(parse({ page: '0' }).page).toBe(1);
  });

  it('caps an absurdly long search', () => {
    expect(parse({ search: 'x'.repeat(500) }).search).toHaveLength(100);
  });

  it('knows when two param sets are the same, ignoring order and empties', () => {
    expect(sameParams({ page: '2', status: 'new' }, { status: 'new', page: '2' })).toBe(true);
    expect(sameParams({ page: '2' }, { page: '3' })).toBe(false);
    expect(sameParams({}, { search: '' })).toBe(true);
    expect(sameParams({ status: 'new' }, {})).toBe(false);
  });
});
