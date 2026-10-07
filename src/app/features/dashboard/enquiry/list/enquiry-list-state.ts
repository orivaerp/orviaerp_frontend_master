import { Injectable, signal } from '@angular/core';
import { ParamMap, Params } from '@angular/router';
import {
  ENQUIRY_CATEGORIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  EnquiryCategory,
  EnquirySource,
  EnquiryStatus,
  FollowUpFilter,
} from '../../../../core/models/enquiry.model';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../../core/models/pagination.model';

/** Everything the enquiry list remembers, so it survives a trip to a lead's detail page. */
export interface EnquiryListQuery {
  page: number;
  limit: number;
  status: EnquiryStatus | '';
  source: EnquirySource | '';
  category: EnquiryCategory | '';
  assignedTo: string;
  followUp: FollowUpFilter | '';
  dateFrom: string;
  dateTo: string;
  search: string;
}

export const DEFAULT_ENQUIRY_LIST_QUERY: EnquiryListQuery = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  status: '',
  source: '',
  category: '',
  assignedTo: '',
  followUp: '',
  dateFrom: '',
  dateTo: '',
  search: '',
};

const FOLLOW_UPS: FollowUpFilter[] = ['overdue', 'today', 'upcoming', 'pending'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const OBJECT_ID = /^[0-9a-f]{24}$/i;

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | '' {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

/** Reads the list state out of the URL. Anything missing or invalid falls back to its default. */
export function fromQueryParams(params: ParamMap): EnquiryListQuery {
  const page = parseInt(params.get('page') ?? '', 10);
  const limit = parseInt(params.get('limit') ?? '', 10);
  const assignedTo = params.get('assignedTo') ?? '';
  const dateFrom = params.get('dateFrom') ?? '';
  const dateTo = params.get('dateTo') ?? '';

  return {
    page: Number.isFinite(page) && page >= 1 ? page : DEFAULT_ENQUIRY_LIST_QUERY.page,
    limit: (PAGE_SIZE_OPTIONS as readonly number[]).includes(limit) ? limit : DEFAULT_PAGE_SIZE,
    status: oneOf(params.get('status'), ENQUIRY_STATUSES),
    source: oneOf(params.get('source'), ENQUIRY_SOURCES),
    category: oneOf(params.get('category'), ENQUIRY_CATEGORIES),
    followUp: oneOf(params.get('followUp'), FOLLOW_UPS),
    assignedTo: assignedTo === 'unassigned' || OBJECT_ID.test(assignedTo) ? assignedTo : '',
    dateFrom: DATE.test(dateFrom) ? dateFrom : '',
    dateTo: DATE.test(dateTo) ? dateTo : '',
    search: (params.get('search') ?? '').trim().slice(0, 100),
  };
}

/** The URL form of the list state: defaults and empty values are left out, so a fresh list has a clean URL. */
export function toQueryParams(query: EnquiryListQuery): Params {
  const params: Params = {};
  if (query.page > 1) params['page'] = String(query.page);
  if (query.limit !== DEFAULT_PAGE_SIZE) params['limit'] = String(query.limit);
  for (const key of [
    'status',
    'source',
    'category',
    'assignedTo',
    'followUp',
    'dateFrom',
    'dateTo',
  ] as const) {
    if (query[key]) params[key] = query[key];
  }
  const search = query.search.trim();
  if (search) params['search'] = search;
  return params;
}

/** True when two param sets say the same thing (used to avoid redundant navigations). */
export function sameParams(a: Params, b: Params): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => String(a[key] ?? '') === String(b[key] ?? ''));
}

/**
 * The last list view the user was on. The "Back to enquiries" links on the detail and add
 * pages use it, so they return to the same page and filters instead of page 1.
 */
@Injectable({ providedIn: 'root' })
export class EnquiryListState {
  readonly params = signal<Params>({});
}
