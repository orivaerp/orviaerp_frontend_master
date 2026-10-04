import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { WhatsappSocketService } from '../../../../core/services/whatsapp-socket.service';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { User } from '../../../../core/models/user.model';
import {
  WaConversation,
  WaConversationFilter,
  WaMessage,
  WaTemplate,
  isWindowOpen,
  templateBodyParamCount,
  templateBodyText,
} from '../../../../core/models/whatsapp.model';

const FILTER_TABS: { v: WaConversationFilter; l: string }[] = [
  { v: 'all', l: 'All' },
  { v: 'unassigned', l: 'Unassigned' },
  { v: 'mine', l: 'Mine' },
];

@Component({
  selector: 'app-whatsapp-inbox',
  imports: [FormsModule, Icon, DatePipe],
  templateUrl: './whatsapp-inbox.html',
})
export class WhatsappInbox {
  readonly filterTabs = FILTER_TABS;

  private readonly whatsappService = inject(WhatsappService);
  private readonly socketService = inject(WhatsappSocketService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly socketConnected = this.socketService.connected;
  readonly socketError = this.socketService.lastError;

  readonly filter = signal<WaConversationFilter>('all');
  readonly conversations = signal<WaConversation[]>([]);
  readonly loadingConversations = signal(true);

  readonly selectedConversation = signal<WaConversation | null>(null);
  readonly messages = signal<WaMessage[]>([]);
  readonly loadingMessages = signal(false);

  readonly agents = signal<User[]>([]);
  readonly assigning = signal(false);
  readonly sending = signal(false);
  readonly draftText = signal('');
  readonly errorMessage = signal('');

  readonly templates = signal<WaTemplate[]>([]);
  readonly templatesLoaded = signal(false);
  readonly selectedTemplateName = signal('');
  readonly templateParams = signal<string[]>([]);
  readonly sendingTemplate = signal(false);

  readonly templateBodyText = templateBodyText;

  readonly windowOpen = computed(() => {
    const conversation = this.selectedConversation();
    return conversation ? isWindowOpen(conversation) : false;
  });

  readonly selectedTemplate = computed<WaTemplate | null>(
    () => this.templates().find((t) => t.name === this.selectedTemplateName()) ?? null
  );

  constructor() {
    this.loadConversations();
    this.userAdminService.getAll().subscribe({ next: (res) => this.agents.set(res.data) });

    this.socketService.connect();
    this.destroyRef.onDestroy(() => this.socketService.disconnect());

    this.socketService.onNewMessage.pipe().subscribe((event) => {
      if (this.selectedConversation()?._id === event.conversationId) {
        this.appendMessageIfNew(event.message);
      }
      this.bumpConversationPreview(event.conversationId, event.message);
    });

    this.socketService.onConversationAssigned.pipe().subscribe((conversation) => {
      this.upsertConversation(conversation);
      if (this.selectedConversation()?._id === conversation._id) {
        this.selectedConversation.set(conversation);
      }
    });

    this.socketService.onMessageStatus.pipe().subscribe((event) => {
      if (this.selectedConversation()?._id !== event.conversationId) return;
      this.messages.update((msgs) =>
        msgs.map((m) => (m._id === event.messageId ? { ...m, status: event.status } : m))
      );
    });
  }

  setFilter(filter: WaConversationFilter): void {
    this.filter.set(filter);
    this.loadConversations();
  }

  private loadConversations(): void {
    this.loadingConversations.set(true);
    this.whatsappService.getConversations(this.filter()).subscribe({
      next: (res) => {
        this.conversations.set(res.data);
        this.loadingConversations.set(false);
      },
      error: (err) => {
        this.loadingConversations.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not load conversations');
      },
    });
  }

  selectConversation(conversation: WaConversation): void {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.loadingMessages.set(true);
    this.errorMessage.set('');

    this.whatsappService.getMessages(conversation._id).subscribe({
      next: (res) => {
        this.messages.set(res.data.messages);
        this.selectedConversation.set(res.data.conversation);
        this.loadingMessages.set(false);
      },
      error: (err) => {
        this.loadingMessages.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not load messages');
      },
    });

    if (conversation.unreadCount > 0) {
      this.whatsappService.markRead(conversation._id).subscribe({
        next: () => this.upsertConversation({ ...conversation, unreadCount: 0 }),
      });
    }

    this.selectedTemplateName.set('');
    this.templateParams.set([]);
    if (!isWindowOpen(conversation)) {
      this.ensureTemplatesLoaded();
    }
  }

  private ensureTemplatesLoaded(): void {
    if (this.templatesLoaded()) return;
    this.templatesLoaded.set(true);
    this.whatsappService.getTemplates().subscribe({
      // Only Approved templates can actually be sent.
      next: (res) => this.templates.set(res.data.filter((t) => t.status === 'APPROVED')),
      error: (err) => {
        this.templatesLoaded.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not load message templates');
      },
    });
  }

  selectTemplate(name: string): void {
    this.selectedTemplateName.set(name);
    const template = this.templates().find((t) => t.name === name);
    const count = template ? templateBodyParamCount(template) : 0;
    this.templateParams.set(Array.from({ length: count }, () => ''));
  }

  setTemplateParam(index: number, value: string): void {
    this.templateParams.update((params) => params.map((p, i) => (i === index ? value : p)));
  }

  sendTemplate(): void {
    const conversation = this.selectedConversation();
    const template = this.selectedTemplate();
    if (!conversation || !template || this.sendingTemplate()) return;

    this.sendingTemplate.set(true);
    this.whatsappService
      .sendTemplateMessage(conversation._id, {
        name: template.name,
        language: template.language,
        bodyParams: this.templateParams(),
      })
      .subscribe({
        next: (res) => {
          this.appendMessageIfNew(res.data);
          this.selectedTemplateName.set('');
          this.templateParams.set([]);
          this.sendingTemplate.set(false);
        },
        error: (err) => {
          this.sendingTemplate.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not send template message');
        },
      });
  }

  sendMessage(): void {
    const conversation = this.selectedConversation();
    const text = this.draftText().trim();
    if (!conversation || !text || this.sending()) return;

    this.sending.set(true);
    this.whatsappService.sendMessage(conversation._id, text).subscribe({
      next: (res) => {
        this.appendMessageIfNew(res.data);
        this.draftText.set('');
        this.sending.set(false);
      },
      error: (err) => {
        this.sending.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not send message');
      },
    });
  }

  assignTo(agentId: string | null): void {
    const conversation = this.selectedConversation();
    if (!conversation || this.assigning()) return;

    this.assigning.set(true);
    this.whatsappService.assign(conversation._id, agentId).subscribe({
      next: (res) => {
        this.selectedConversation.set(res.data);
        this.upsertConversation(res.data);
        this.assigning.set(false);
      },
      error: (err) => {
        this.assigning.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not update assignment');
      },
    });
  }

  agentLabel(agent: { firstName: string; lastName?: string } | null): string {
    if (!agent) return 'Unassigned';
    return `${agent.firstName} ${agent.lastName ?? ''}`.trim();
  }

  private appendMessageIfNew(message: WaMessage): void {
    this.messages.update((msgs) => (msgs.some((m) => m._id === message._id) ? msgs : [...msgs, message]));
  }

  private upsertConversation(conversation: WaConversation): void {
    this.conversations.update((list) => {
      const exists = list.some((c) => c._id === conversation._id);
      const next = exists ? list.map((c) => (c._id === conversation._id ? conversation : c)) : [conversation, ...list];
      return [...next].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    });
  }

  private bumpConversationPreview(conversationId: string, message: WaMessage): void {
    const existing = this.conversations().find((c) => c._id === conversationId);
    if (!existing) {
      // Brand-new contact we don't have in the list yet - simplest correct
      // thing is to just refresh rather than hand-build a conversation object.
      this.loadConversations();
      return;
    }

    const isOpenHere = this.selectedConversation()?._id === conversationId;
    this.upsertConversation({
      ...existing,
      lastMessageAt: message.timestamp,
      lastMessagePreview: message.text ? message.text.slice(0, 120) : `[${message.type}]`,
      lastInboundAt: message.direction === 'inbound' ? message.timestamp : existing.lastInboundAt,
      unreadCount: message.direction === 'inbound' && !isOpenHere ? existing.unreadCount + 1 : existing.unreadCount,
    });
  }
}
