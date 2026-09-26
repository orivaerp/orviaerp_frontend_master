import { Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EnquiryService } from '../../../../core/services/enquiry.service';
import { ProductService } from '../../../../core/services/product.service';
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
  imports: [RouterLink, FormsModule, ReactiveFormsModule, SlicePipe],
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
  private readonly productService = inject(ProductService);
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
    this.selectedCategory() ? ENQUIRY_SUBCATEGORY_SUGGESTIONS[this.selectedCategory() as EnquiryCategory] : []
  );

  constructor() {
    this.load();

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
        this.enquiry.set(res.data);
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

  noteAuthor(note: Enquiry['notes'][number]): string {
    if (!note.addedBy) return 'Someone';
    if (typeof note.addedBy === 'string') return note.addedBy;
    return `${note.addedBy.firstName} ${note.addedBy.lastName ?? ''}`.trim();
  }

  setStatus(status: EnquiryStatus): void {
    const enquiry = this.enquiry();
    if (!enquiry || enquiry.status === status) return;

    this.updatingStatus.set(true);
    this.enquiryService.update(this.enquiryId, { status }).subscribe({
      next: (res) => {
        this.enquiry.set(res.data);
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
          this.enquiry.set(res.data);
          this.saving.set(false);
          this.editing.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not save changes');
        },
      });
  }

  addNote(): void {
    const text = this.noteText().trim();
    if (!text) return;

    this.addingNote.set(true);
    this.enquiryService.addNote(this.enquiryId, text).subscribe({
      next: (res) => {
        this.enquiry.set(res.data);
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
