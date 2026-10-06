import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import { PageParams, appendPageParams } from '../models/pagination.model';
import {
  Enquiry,
  EnquiryCategory,
  EnquirySource,
  EnquiryStats,
  EnquiryStatus,
  FollowUpFilter,
} from '../models/enquiry.model';

export interface LeadDetailFields {
  category?: EnquiryCategory | '';
  subCategory?: string;
  firmName?: string;
  website?: string;
  city?: string;
  address?: string;
  state?: string;
}

export interface CreateEnquiryPayload extends LeadDetailFields {
  /** Honoured only for admins; a lead added by staff is assigned to them automatically. */
  assignedTo?: string;
  name: string;
  email?: string;
  phone: string;
  message?: string;
  product?: string;
  subject?: string;
  source?: EnquirySource;
  status?: EnquiryStatus;
}

export interface UpdateEnquiryPayload extends LeadDetailFields {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  product?: string;
  subject?: string;
  status?: EnquiryStatus;
  source?: EnquirySource;
  assignedTo?: string | null;
}

export interface EnquiryFilter {
  status?: EnquiryStatus | '';
  source?: EnquirySource | '';
  category?: EnquiryCategory | '';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  /** Admin only: a user id, or 'unassigned'. Ignored by the server for everyone else. */
  assignedTo?: string;
  followUp?: FollowUpFilter | '';
}

export interface BulkAssignResult {
  /** Leads whose assignee actually changed. */
  updated: number;
  /** Leads that were already assigned to that person. */
  unchanged: number;
  /** Ids that no longer exist (e.g. deleted meanwhile). */
  notFound: number;
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

function toQueryString(filter?: EnquiryFilter, page?: PageParams): string {
  const params = new URLSearchParams();
  appendPageParams(params, page);
  // Lets the server work out "today" for follow-ups in the viewer's timezone, not its own.
  params.set('tzOffset', String(new Date().getTimezoneOffset()));
  if (!filter) return '?' + params.toString();
  if (filter.status) params.set('status', filter.status);
  if (filter.source) params.set('source', filter.source);
  if (filter.category) params.set('category', filter.category);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.search) params.set('search', filter.search);
  if (filter.assignedTo) params.set('assignedTo', filter.assignedTo);
  if (filter.followUp) params.set('followUp', filter.followUp);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/enquiries`;

  /** Pass `page` for one server-side page (response includes `meta`); omit for everything. */
  getAll(filter?: EnquiryFilter, page?: PageParams): Observable<ApiSuccess<Enquiry[]>> {
    return this.http.get<ApiSuccess<Enquiry[]>>(`${this.baseUrl}${toQueryString(filter, page)}`);
  }

  getStats(filter?: EnquiryFilter): Observable<ApiSuccess<EnquiryStats>> {
    return this.http.get<ApiSuccess<EnquiryStats>>(`${this.baseUrl}/stats${toQueryString(filter)}`);
  }

  getById(id: string): Observable<ApiSuccess<Enquiry>> {
    return this.http.get<ApiSuccess<Enquiry>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateEnquiryPayload): Observable<ApiSuccess<Enquiry>> {
    return this.http.post<ApiSuccess<Enquiry>>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateEnquiryPayload): Observable<ApiSuccess<Enquiry>> {
    return this.http.put<ApiSuccess<Enquiry>>(`${this.baseUrl}/${id}`, payload);
  }

  /** `followUpAt` (ISO string) also schedules the lead's next follow-up. */
  addNote(id: string, text: string, followUpAt?: string | null): Observable<ApiSuccess<Enquiry>> {
    return this.http.post<ApiSuccess<Enquiry>>(`${this.baseUrl}/${id}/notes`, {
      text,
      ...(followUpAt ? { followUpAt } : {}),
    });
  }

  /** Admin only: give many leads to one person at once (null unassigns them all). */
  bulkAssign(ids: string[], assignedTo: string | null): Observable<ApiSuccess<BulkAssignResult>> {
    return this.http.post<ApiSuccess<BulkAssignResult>>(`${this.baseUrl}/bulk-assign`, {
      ids,
      assignedTo,
    });
  }

  completeFollowUp(id: string, text?: string): Observable<ApiSuccess<Enquiry>> {
    return this.http.post<ApiSuccess<Enquiry>>(`${this.baseUrl}/${id}/followup/complete`, {
      ...(text ? { text } : {}),
    });
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }

  exportCsv(filter?: EnquiryFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export${toQueryString(filter)}`, {
      responseType: 'blob',
    });
  }

  importCsv(csv: string): Observable<ApiSuccess<ImportResult>> {
    return this.http.post<ApiSuccess<ImportResult>>(`${this.baseUrl}/import`, { csv });
  }
}
