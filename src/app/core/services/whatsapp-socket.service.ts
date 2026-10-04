import { Injectable, OnDestroy, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WaConversation, WaMessage, WaMessageStatus } from '../models/whatsapp.model';

export interface NewMessageEvent {
  conversationId: string;
  message: WaMessage;
}

export interface MessageStatusEvent {
  conversationId: string;
  messageId: string;
  status: WaMessageStatus;
}

export interface BroadcastProgressEvent {
  broadcastId: string;
  sentCount: number;
  failedCount: number;
  totalCount: number;
}

export interface BroadcastCompletedEvent {
  broadcastId: string;
}

/** Origin the API is served from, without the /api/v1 suffix - Socket.IO
 *  connects to the server root, not a REST path. */
const SOCKET_ORIGIN = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

@Injectable({ providedIn: 'root' })
export class WhatsappSocketService implements OnDestroy {
  private socket: Socket | null = null;

  private readonly newMessage$ = new Subject<NewMessageEvent>();
  private readonly conversationAssigned$ = new Subject<WaConversation>();
  private readonly messageStatus$ = new Subject<MessageStatusEvent>();
  private readonly broadcastProgress$ = new Subject<BroadcastProgressEvent>();
  private readonly broadcastCompleted$ = new Subject<BroadcastCompletedEvent>();

  readonly onNewMessage = this.newMessage$.asObservable();
  readonly onConversationAssigned = this.conversationAssigned$.asObservable();
  readonly onMessageStatus = this.messageStatus$.asObservable();
  readonly onBroadcastProgress = this.broadcastProgress$.asObservable();
  readonly onBroadcastCompleted = this.broadcastCompleted$.asObservable();

  /** Exposed so the inbox screen can show "live updates unavailable" instead
   *  of silently just never updating when the socket can't connect. */
  readonly connected = signal(false);
  readonly lastError = signal('');

  /** Connects using the existing session cookie - no separate socket login. */
  connect(): void {
    if (this.socket) return;

    this.socket = io(SOCKET_ORIGIN, { withCredentials: true });

    this.socket.on('connect', () => {
      console.log('[whatsapp socket] connected', this.socket?.id);
      this.connected.set(true);
      this.lastError.set('');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[whatsapp socket] disconnected:', reason);
      this.connected.set(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[whatsapp socket] connect_error:', err.message);
      this.connected.set(false);
      this.lastError.set(err.message);
    });

    this.socket.on('new_message', (payload: NewMessageEvent) => {
      console.log('[whatsapp socket] new_message', payload);
      this.newMessage$.next(payload);
    });
    this.socket.on('conversation_assigned', (payload: WaConversation) =>
      this.conversationAssigned$.next(payload)
    );
    this.socket.on('message_status_update', (payload: MessageStatusEvent) =>
      this.messageStatus$.next(payload)
    );
    this.socket.on('broadcast_progress', (payload: BroadcastProgressEvent) =>
      this.broadcastProgress$.next(payload)
    );
    this.socket.on('broadcast_completed', (payload: BroadcastCompletedEvent) =>
      this.broadcastCompleted$.next(payload)
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
