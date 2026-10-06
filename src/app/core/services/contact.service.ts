import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import { PageParams, appendPageParams } from '../models/pagination.model';
import {
  ContactBudget,
  ContactService as ContactServiceType,
  ContactStats,
  ContactStatus,
  ContactSubmission,
  ContactTimeline,
} from '../models/contact.model';

export interface CreateContactPayload {
  name: string;
  email: string;
  phone: string;
  company?: string;
  companyWebsite?: string;
  service: ContactServiceType;
  budget?: ContactBudget | '';
  timeline?: ContactTimeline | '';
  message: string;
}

export interface UpdateContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyWebsite?: string;
  service?: ContactServiceType;
  budget?: ContactBudget | '';
  timeline?: ContactTimeline | '';
  message?: string;
  status?: ContactStatus;
  assignedTo?: string | null;
}

export interface ContactFilter {
  status?: ContactStatus | '';
  service?: ContactServiceType | '';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

function toQueryString(filter?: ContactFilter, page?: PageParams): string {
  const params = new URLSearchParams();
  appendPageParams(params, page);
  if (!filter) return params.toString() ? '?' + params.toString() : '';
  if (filter.status) params.set('status', filter.status);
  if (filter.service) params.set('service', filter.service);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.search) params.set('search', filter.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/contacts`;

  getAll(filter?: ContactFilter, page?: PageParams): Observable<ApiSuccess<ContactSubmission[]>> {
    return this.http.get<ApiSuccess<ContactSubmission[]>>(`${this.baseUrl}${toQueryString(filter, page)}`);
  }

  getStats(filter?: ContactFilter): Observable<ApiSuccess<ContactStats>> {
    return this.http.get<ApiSuccess<ContactStats>>(`${this.baseUrl}/stats${toQueryString(filter)}`);
  }

  getById(id: string): Observable<ApiSuccess<ContactSubmission>> {
    return this.http.get<ApiSuccess<ContactSubmission>>(`${this.baseUrl}/${id}`);
  }

  /** Public submission — used by the marketing site's "Project brief" form. */
  submit(payload: CreateContactPayload): Observable<ApiSuccess<ContactSubmission>> {
    return this.http.post<ApiSuccess<ContactSubmission>>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateContactPayload): Observable<ApiSuccess<ContactSubmission>> {
    return this.http.put<ApiSuccess<ContactSubmission>>(`${this.baseUrl}/${id}`, payload);
  }

  addNote(id: string, text: string): Observable<ApiSuccess<ContactSubmission>> {
    return this.http.post<ApiSuccess<ContactSubmission>>(`${this.baseUrl}/${id}/notes`, { text });
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }

  exportCsv(filter?: ContactFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export${toQueryString(filter)}`, { responseType: 'blob' });
  }
}
