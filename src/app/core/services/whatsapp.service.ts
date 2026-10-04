import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import {
  WaBroadcast,
  WaConversation,
  WaConversationFilter,
  WaHeaderMedia,
  WaMessage,
  WaTemplate,
} from '../models/whatsapp.model';

export interface ConversationMessagesResponse {
  conversation: WaConversation;
  messages: WaMessage[];
}

export interface SendTemplatePayload {
  name: string;
  language: string;
  bodyParams: string[];
}

export interface CreateBroadcastPayload {
  templateName: string;
  templateLanguage: string;
  bodyParams: string[];
  headerMedia?: WaHeaderMedia;
  recipients: string[];
}

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/whatsapp/conversations`;
  private readonly templatesUrl = `${environment.apiUrl}/whatsapp/templates`;
  private readonly broadcastsUrl = `${environment.apiUrl}/whatsapp/broadcasts`;

  getConversations(filter: WaConversationFilter = 'all'): Observable<ApiSuccess<WaConversation[]>> {
    return this.http.get<ApiSuccess<WaConversation[]>>(`${this.baseUrl}?filter=${filter}`);
  }

  getMessages(conversationId: string): Observable<ApiSuccess<ConversationMessagesResponse>> {
    return this.http.get<ApiSuccess<ConversationMessagesResponse>>(`${this.baseUrl}/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, text: string): Observable<ApiSuccess<WaMessage>> {
    return this.http.post<ApiSuccess<WaMessage>>(`${this.baseUrl}/${conversationId}/messages`, { text });
  }

  assign(conversationId: string, assignedTo: string | null): Observable<ApiSuccess<WaConversation>> {
    return this.http.patch<ApiSuccess<WaConversation>>(`${this.baseUrl}/${conversationId}/assign`, {
      assignedTo,
    });
  }

  markRead(conversationId: string): Observable<ApiSuccess<WaConversation>> {
    return this.http.patch<ApiSuccess<WaConversation>>(`${this.baseUrl}/${conversationId}/read`, {});
  }

  getTemplates(): Observable<ApiSuccess<WaTemplate[]>> {
    return this.http.get<ApiSuccess<WaTemplate[]>>(this.templatesUrl);
  }

  sendTemplateMessage(conversationId: string, payload: SendTemplatePayload): Observable<ApiSuccess<WaMessage>> {
    return this.http.post<ApiSuccess<WaMessage>>(`${this.baseUrl}/${conversationId}/template-messages`, payload);
  }

  createBroadcast(payload: CreateBroadcastPayload): Observable<ApiSuccess<WaBroadcast>> {
    return this.http.post<ApiSuccess<WaBroadcast>>(this.broadcastsUrl, payload);
  }

  getBroadcasts(): Observable<ApiSuccess<WaBroadcast[]>> {
    return this.http.get<ApiSuccess<WaBroadcast[]>>(this.broadcastsUrl);
  }

  getBroadcastById(id: string): Observable<ApiSuccess<WaBroadcast>> {
    return this.http.get<ApiSuccess<WaBroadcast>>(`${this.broadcastsUrl}/${id}`);
  }
}
