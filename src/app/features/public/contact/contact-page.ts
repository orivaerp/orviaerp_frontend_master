import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import {
  CONTACT_BUDGET_OPTIONS,
  CONTACT_SERVICE_OPTIONS,
  CONTACT_TIMELINE_OPTIONS,
  ContactBudget,
  ContactService as ContactServiceType,
  ContactTimeline,
} from '../../../core/models/contact.model';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './contact-page.html',
})
export class ContactPage {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly services = CONTACT_SERVICE_OPTIONS;
  readonly budgets = CONTACT_BUDGET_OPTIONS;
  readonly timelines = CONTACT_TIMELINE_OPTIONS;

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    companyWebsite: [''],
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    service: ['' as ContactServiceType | '', [Validators.required]],
    budget: ['' as ContactBudget | ''],
    timeline: ['' as ContactTimeline | ''],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.contactService
      .submit({
        name: value.name!,
        email: value.email!,
        phone: value.phone!,
        company: value.company || undefined,
        companyWebsite: value.companyWebsite || undefined,
        service: value.service as ContactServiceType,
        budget: value.budget || undefined,
        timeline: value.timeline || undefined,
        message: value.message!,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not send your brief — please try again.');
        },
      });
  }
}
