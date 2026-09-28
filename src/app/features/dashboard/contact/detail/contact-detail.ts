import { Component, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactService } from '../../../../core/services/contact.service';
import {
  CONTACT_STATUSES,
  ContactStatus,
  ContactSubmission,
  budgetLabel,
  serviceLabel,
  timelineLabel,
} from '../../../../core/models/contact.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

function formatStatusLabel(status: ContactStatus): string {
  return status
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

@Component({
  selector: 'app-contact-detail',
  imports: [RouterLink, FormsModule, SlicePipe],
  templateUrl: './contact-detail.html',
})
export class ContactDetail {
  readonly statuses = CONTACT_STATUSES;
  readonly statusLabel = formatStatusLabel;
  readonly serviceLabel = serviceLabel;
  readonly budgetLabel = budgetLabel;
  readonly timelineLabel = timelineLabel;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contactService = inject(ContactService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  private readonly contactId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly submission = signal<ContactSubmission | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal('');
  readonly updatingStatus = signal(false);
  readonly deleting = signal(false);
  readonly addingNote = signal(false);
  readonly noteText = signal('');

  constructor() {
    this.load();
  }

  private load(): void {
    this.contactService.getById(this.contactId).subscribe({
      next: (res) => {
        this.submission.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Could not load this submission');
        }
      },
    });
  }

  noteAuthor(note: ContactSubmission['notes'][number]): string {
    if (!note.addedBy) return 'Someone';
    if (typeof note.addedBy === 'string') return note.addedBy;
    return `${note.addedBy.firstName} ${note.addedBy.lastName ?? ''}`.trim();
  }

  setStatus(status: ContactStatus): void {
    const submission = this.submission();
    if (!submission || submission.status === status) return;

    this.updatingStatus.set(true);
    this.contactService.update(this.contactId, { status }).subscribe({
      next: (res) => {
        this.submission.set(res.data);
        this.updatingStatus.set(false);
      },
      error: (err) => {
        this.updatingStatus.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not update status');
      },
    });
  }

  addNote(): void {
    const text = this.noteText().trim();
    if (!text) return;

    this.addingNote.set(true);
    this.contactService.addNote(this.contactId, text).subscribe({
      next: (res) => {
        this.submission.set(res.data);
        this.noteText.set('');
        this.addingNote.set(false);
      },
      error: (err) => {
        this.addingNote.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not add note');
      },
    });
  }

  async remove(): Promise<void> {
    const submission = this.submission();
    if (!submission) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete submission',
      message: `This will remove the submission from ${submission.name} from the list. The record is kept, not permanently erased.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.contactService.delete(this.contactId).subscribe({
      next: () => this.router.navigate(['/dashboard/contacts']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete this submission');
      },
    });
  }
}
