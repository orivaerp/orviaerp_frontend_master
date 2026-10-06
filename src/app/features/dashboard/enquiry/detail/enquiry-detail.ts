import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EnquiryService } from '../../../../core/services/enquiry.service';
import { ProductService } from '../../../../core/services/product.service';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { User } from '../../../../core/models/user.model';
import {
  buildTimeline,
  followUpPresets,
  followUpState,
  personId,
  personName,
  toDateTimeLocal,
} from '../shared/lead-activity';
import { Product } from '../../../../core/models/product.model';
import {
  ENQUIRY_CATEGORIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  ENQUIRY_SUBCATEGORY_SUGGESTIONS,
  Enquiry,
  EnquiryCategory,
  EnquirySource,
  EnquiryStatus,
} from '../../../../core/models/enquiry.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { formatEnumLabel } from '../../../../shared/utils/format-label';

@Component({
  selector: 'app-enquiry-detail',
  imports: [RouterLink, FormsModule, ReactiveFormsModule, SlicePipe, DatePipe],
  templateUrl: './enquiry-detail.html',
})
export class EnquiryDetail {
  readonly statuses = ENQUIRY_STATUSES;
  readonly sources = ENQUIRY_SOURCES;
  readonly categories = ENQUIRY_CATEGORIES;
  readonly label = formatEnumLabel;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly enquiryService = inject(EnquiryService);
  readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  private readonly enquiryId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly enquiry = signal<Enquiry | null>(null);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal('');
  readonly updatingStatus = signal(false);
  readonly deleting = signal(false);
  readonly addingNote = signal(false);
  readonly noteText = signal('');

  // Assignment (admin only)
  readonly assignees = signal<User[]>([]);
  readonly assigneeId = signal('');
  readonly assigning = signal(false);
  readonly currentAssigneeId = computed(() => personId(this.enquiry()?.assignedTo));

  // Remark → optional follow-up
  readonly followUpEnabled = signal(false);
  readonly followUpAt = signal('');
  readonly followUpError = signal('');
  readonly followUpPresets = followUpPresets();
  readonly minFollowUp = toDateTimeLocal(new Date());

  // Pending follow-up → done
  readonly outcomeText = signal('');
  readonly completing = signal(false);

  readonly timeline = computed(() => {
    const enquiry = this.enquiry();
    return enquiry ? buildTimeline(enquiry) : [];
  });

  readonly personName = personName;
  readonly followUpState = followUpState;

  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    email: ['', [Validators.email]],
    subject: ['', [Validators.maxLength(200)]],
    message: ['', [Validators.minLength(5)]],
    product: [''],
    source: ['website' as EnquirySource],
    category: ['' as EnquiryCategory | ''],
    subCategory: [''],
    firmName: [''],
    website: [''],
    city: [''],
    address: [''],
    state: [''],
  });

  private readonly selectedCategory = signal<EnquiryCategory | ''>('');
  readonly subCategorySuggestions = computed(() =>
    this.selectedCategory()
      ? ENQUIRY_SUBCATEGORY_SUGGESTIONS[this.selectedCategory() as EnquiryCategory]
      : [],
  );

  constructor() {
    this.load();

    if (this.authService.isAdmin()) {
      this.userAdminService.getAll().subscribe({
        next: (res) => this.assignees.set(res.data.filter((u) => u.status === 'active')),
        error: () => {},
      });
    }

    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => {},
    });

    this.form.controls.category.valueChanges.subscribe((value) => {
      this.selectedCategory.set((value ?? '') as EnquiryCategory | '');
    });
  }

  private load(): void {
    this.enquiryService.getById(this.enquiryId).subscribe({
      next: (res) => {
        this.applyEnquiry(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Could not load this enquiry');
        }
      },
    });
  }

  /** Single place that takes a fresh server copy, so the assignee dropdown never goes stale. */
  private applyEnquiry(enquiry: Enquiry): void {
    this.enquiry.set(enquiry);
    this.assigneeId.set(personId(enquiry.assignedTo));
  }

  private idOf(ref: Enquiry['product']): string {
    if (!ref) return '';
    return typeof ref === 'string' ? ref : ref._id;
  }

  productName(enquiry: Enquiry): string | null {
    if (!enquiry.product) return null;
    return typeof enquiry.product === 'string' ? enquiry.product : enquiry.product.name;
  }

  hasBusinessDetails(enquiry: Enquiry): boolean {
    return !!(
      enquiry.category ||
      enquiry.subCategory ||
      enquiry.firmName ||
      enquiry.website ||
      enquiry.city ||
      enquiry.address ||
      enquiry.state
    );
  }

  setStatus(status: EnquiryStatus): void {
    const enquiry = this.enquiry();
    if (!enquiry || enquiry.status === status) return;

    this.updatingStatus.set(true);
    this.enquiryService.update(this.enquiryId, { status }).subscribe({
      next: (res) => {
        this.applyEnquiry(res.data);
        this.updatingStatus.set(false);
      },
      error: (err) => {
        this.updatingStatus.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not update status');
      },
    });
  }

  startEdit(): void {
    const enquiry = this.enquiry();
    if (!enquiry) return;

    this.selectedCategory.set(enquiry.category ?? '');
    this.form.patchValue({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email ?? '',
      subject: enquiry.subject ?? '',
      message: enquiry.message ?? '',
      product: this.idOf(enquiry.product),
      source: enquiry.source,
      category: enquiry.category ?? '',
      subCategory: enquiry.subCategory ?? '',
      firmName: enquiry.firmName ?? '',
      website: enquiry.website ?? '',
      city: enquiry.city ?? '',
      address: enquiry.address ?? '',
      state: enquiry.state ?? '',
    });
    this.errorMessage.set('');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.enquiryService
      .update(this.enquiryId, {
        name: value.name!,
        phone: value.phone!,
        email: value.email ?? '',
        subject: value.subject ?? '',
        message: value.message ?? '',
        product: value.product ?? '',
        source: value.source as EnquirySource,
        category: (value.category ?? '') as EnquiryCategory | '',
        subCategory: value.subCategory ?? '',
        firmName: value.firmName ?? '',
        website: value.website ?? '',
        city: value.city ?? '',
        address: value.address ?? '',
        state: value.state ?? '',
      })
      .subscribe({
        next: (res) => {
          this.applyEnquiry(res.data);
          this.saving.set(false);
          this.editing.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not save changes');
        },
      });
  }

  assign(): void {
    if (!this.authService.isAdmin() || this.assigning()) return;

    this.assigning.set(true);
    this.errorMessage.set('');
    this.enquiryService
      .update(this.enquiryId, { assignedTo: this.assigneeId() || null })
      .subscribe({
        next: (res) => {
          this.applyEnquiry(res.data);
          this.assigning.set(false);
        },
        error: (err) => {
          this.assigning.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not assign this lead');
        },
      });
  }

  pickFollowUpPreset(value: string): void {
    this.followUpEnabled.set(true);
    this.followUpAt.set(value);
    this.followUpError.set('');
  }

  addNote(): void {
    const text = this.noteText().trim();
    if (!text) return;

    let followUpIso: string | undefined;
    if (this.followUpEnabled()) {
      const picked = this.followUpAt();
      const when = picked ? new Date(picked) : null;
      if (!when || Number.isNaN(when.getTime())) {
        this.followUpError.set('Pick a date and time for the follow-up.');
        return;
      }
      if (when.getTime() < Date.now() - 60_000) {
        this.followUpError.set('The follow-up needs to be in the future.');
        return;
      }
      followUpIso = when.toISOString();
    }
    this.followUpError.set('');

    this.addingNote.set(true);
    this.enquiryService.addNote(this.enquiryId, text, followUpIso).subscribe({
      next: (res) => {
        this.applyEnquiry(res.data);
        this.noteText.set('');
        this.followUpEnabled.set(false);
        this.followUpAt.set('');
        this.addingNote.set(false);
      },
      error: (err) => {
        this.addingNote.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not add remark');
      },
    });
  }

  completeFollowUp(): void {
    if (this.completing()) return;

    this.completing.set(true);
    this.errorMessage.set('');
    this.enquiryService
      .completeFollowUp(this.enquiryId, this.outcomeText().trim() || undefined)
      .subscribe({
        next: (res) => {
          this.applyEnquiry(res.data);
          this.outcomeText.set('');
          this.completing.set(false);
        },
        error: (err) => {
          this.completing.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not mark the follow-up done');
        },
      });
  }

  async remove(): Promise<void> {
    const enquiry = this.enquiry();
    if (!enquiry) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete enquiry',
      message: `This will remove the enquiry from ${enquiry.name} from the list. The record is kept, not permanently erased.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.enquiryService.delete(this.enquiryId).subscribe({
      next: () => this.router.navigate(['/dashboard/enquiries']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete this enquiry');
      },
    });
  }
}
