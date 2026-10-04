import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { WhatsappSocketService } from '../../../../core/services/whatsapp-socket.service';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  WaBroadcast,
  WaHeaderMedia,
  WaTemplate,
  templateBodyParamCount,
  templateBodyText,
  templateHeaderMediaType,
} from '../../../../core/models/whatsapp.model';

const MAX_RECIPIENTS = 1000;

function parseRecipients(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[\n,]/)
    .map((v) => v.replace(/[^0-9]/g, '').trim())
    .filter((v) => v.length >= 7 && v.length <= 15)
    .filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
}

@Component({
  selector: 'app-whatsapp-broadcast',
  imports: [FormsModule, Icon, DatePipe],
  templateUrl: './whatsapp-broadcast.html',
})
export class WhatsappBroadcast {
  private readonly whatsappService = inject(WhatsappService);
  private readonly socketService = inject(WhatsappSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templateBodyText = templateBodyText;
  readonly maxRecipients = MAX_RECIPIENTS;

  readonly templates = signal<WaTemplate[]>([]);
  readonly loadingTemplates = signal(true);

  readonly selectedTemplateName = signal('');
  readonly templateParams = signal<string[]>([]);
  readonly recipientsRaw = signal('');
  readonly sending = signal(false);
  readonly errorMessage = signal('');

  readonly broadcasts = signal<WaBroadcast[]>([]);
  readonly loadingBroadcasts = signal(true);

  readonly selectedTemplate = computed<WaTemplate | null>(
    () => this.templates().find((t) => t.name === this.selectedTemplateName()) ?? null
  );

  /** Media type the selected template's header needs (image/video/document), else null. */
  readonly headerMediaType = computed(() => {
    const template = this.selectedTemplate();
    return template ? templateHeaderMediaType(template) : null;
  });
  /** Either a Meta media ID (digits) or a public https URL. */
  readonly headerMediaRef = signal('');

  readonly recipients = computed(() => parseRecipients(this.recipientsRaw()));
  readonly recipientCount = computed(() => this.recipients().length);
  readonly tooManyRecipients = computed(() => this.recipientCount() > MAX_RECIPIENTS);
  // Meta rejects empty body values and a missing required header, which would
  // otherwise fail every single recipient.
  readonly missingTemplateValues = computed(() => this.templateParams().some((p) => !p.trim()));
  readonly missingHeaderMedia = computed(
    () => !!this.headerMediaType() && !this.headerMediaRef().trim()
  );
  readonly canSend = computed(
    () =>
      !!this.selectedTemplate() &&
      this.recipientCount() > 0 &&
      !this.tooManyRecipients() &&
      !this.missingTemplateValues() &&
      !this.missingHeaderMedia() &&
      !this.sending()
  );

  constructor() {
    this.whatsappService.getTemplates().subscribe({
      // Only Approved templates can actually be sent.
      next: (res) => {
        this.templates.set(res.data.filter((t) => t.status === 'APPROVED'));
        this.loadingTemplates.set(false);
      },
      error: (err) => {
        this.loadingTemplates.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not load templates');
      },
    });

    this.loadBroadcasts();

    this.socketService.connect();
    this.destroyRef.onDestroy(() => this.socketService.disconnect());

    this.socketService.onBroadcastProgress.subscribe((event) => {
      this.broadcasts.update((list) =>
        list.map((b) =>
          b._id === event.broadcastId
            ? { ...b, sentCount: event.sentCount, failedCount: event.failedCount }
            : b
        )
      );
    });

    this.socketService.onBroadcastCompleted.subscribe((event) => {
      this.broadcasts.update((list) =>
        list.map((b) => (b._id === event.broadcastId ? { ...b, status: 'completed' } : b))
      );
    });
  }

  private loadBroadcasts(): void {
    this.whatsappService.getBroadcasts().subscribe({
      next: (res) => {
        this.broadcasts.set(res.data);
        this.loadingBroadcasts.set(false);
      },
      error: () => this.loadingBroadcasts.set(false),
    });
  }

  firstError(broadcast: WaBroadcast): string {
    return broadcast.recipients?.find((r) => r.status === 'failed' && r.error)?.error ?? '';
  }

  selectTemplate(name: string): void {
    this.selectedTemplateName.set(name);
    const template = this.templates().find((t) => t.name === name);
    const count = template ? templateBodyParamCount(template) : 0;
    this.templateParams.set(Array.from({ length: count }, () => ''));
    this.headerMediaRef.set('');
  }

  private buildHeaderMedia(): WaHeaderMedia | undefined {
    const type = this.headerMediaType();
    const ref = this.headerMediaRef().trim();
    if (!type || !ref) return undefined;
    return /^https?:\/\//i.test(ref) ? { type, link: ref } : { type, id: ref };
  }

  setTemplateParam(index: number, value: string): void {
    this.templateParams.update((params) => params.map((p, i) => (i === index ? value : p)));
  }

  send(): void {
    const template = this.selectedTemplate();
    if (!template || !this.canSend()) return;

    this.sending.set(true);
    this.errorMessage.set('');

    this.whatsappService
      .createBroadcast({
        templateName: template.name,
        templateLanguage: template.language,
        bodyParams: this.templateParams().map((p) => p.trim()),
        headerMedia: this.buildHeaderMedia(),
        recipients: this.recipients(),
      })
      .subscribe({
        next: (res) => {
          this.broadcasts.update((list) => [res.data, ...list]);
          this.sending.set(false);
          this.recipientsRaw.set('');
          this.selectedTemplateName.set('');
          this.templateParams.set([]);
          this.headerMediaRef.set('');
        },
        error: (err) => {
          this.sending.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not start broadcast');
        },
      });
  }
}
