import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import { Enquiry, EnquiryCategory, EnquirySource, EnquiryStats, EnquiryStatus } from '../models/enquiry.model';

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
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

function toQueryString(filter?: EnquiryFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.source) params.set('source', filter.source);
  if (filter.category) params.set('category', filter.category);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.search) params.set('search', filter.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/enquiries`;

  getAll(filter?: EnquiryFilter): Observable<ApiSuccess<Enquiry[]>> {
    return this.http.get<ApiSuccess<Enquiry[]>>(`${this.baseUrl}${toQueryString(filter)}`);
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

  addNote(id: string, text: string): Observable<ApiSuccess<Enquiry>> {
    return this.http.post<ApiSuccess<Enquiry>>(`${this.baseUrl}/${id}/notes`, { text });
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }

  exportCsv(filter?: EnquiryFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export${toQueryString(filter)}`, { responseType: 'blob' });
  }

  importCsv(csv: string): Observable<ApiSuccess<ImportResult>> {
    return this.http.post<ApiSuccess<ImportResult>>(`${this.baseUrl}/import`, { csv });
  }
}
