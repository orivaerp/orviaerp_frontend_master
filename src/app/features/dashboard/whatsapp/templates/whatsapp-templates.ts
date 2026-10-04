import { Component, inject, signal } from '@angular/core';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { WaTemplate, templateBodyText } from '../../../../core/models/whatsapp.model';

const STATUS_BADGE_CLASS: Record<string, string> = {
  APPROVED: 'badge bg-[var(--color-success-soft)] text-[var(--color-success)]',
  REJECTED: 'badge bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  PENDING: 'badge bg-amber-50 text-amber-700',
  IN_APPEAL: 'badge bg-amber-50 text-amber-700',
  PENDING_DELETION: 'badge bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  DISABLED: 'badge bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  PAUSED: 'badge bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
};

function statusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASS[status] ?? 'badge bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]';
}

@Component({
  selector: 'app-whatsapp-templates',
  imports: [],
  templateUrl: './whatsapp-templates.html',
})
export class WhatsappTemplates {
  private readonly whatsappService = inject(WhatsappService);

  readonly templateBodyText = templateBodyText;
  readonly statusBadgeClass = statusBadgeClass;
  readonly templates = signal<WaTemplate[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.whatsappService.getTemplates().subscribe({
      next: (res) => {
        this.templates.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Could not load templates from the WhatsApp Business Account'
        );
      },
    });
  }
}
