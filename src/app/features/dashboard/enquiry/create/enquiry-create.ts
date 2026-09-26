import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EnquiryService } from '../../../../core/services/enquiry.service';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import {
  ENQUIRY_CATEGORIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  ENQUIRY_SUBCATEGORY_SUGGESTIONS,
  EnquiryCategory,
  EnquirySource,
  EnquiryStatus,
} from '../../../../core/models/enquiry.model';
import { formatEnumLabel } from '../../../../shared/utils/format-label';

@Component({
  selector: 'app-enquiry-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './enquiry-create.html',
})
export class EnquiryCreate {
  private readonly fb = inject(FormBuilder);
  private readonly enquiryService = inject(EnquiryService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  readonly sources = ENQUIRY_SOURCES;
  readonly statuses = ENQUIRY_STATUSES;
  readonly categories = ENQUIRY_CATEGORIES;
  readonly label = formatEnumLabel;

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    subject: ['', [Validators.maxLength(200)]],
    message: ['', [Validators.minLength(5)]],
    product: [''],
    source: ['website' as EnquirySource, [Validators.required]],
    status: ['new' as EnquiryStatus, [Validators.required]],
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
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => {},
    });

    this.form.controls.category.valueChanges.subscribe((value) => {
      this.selectedCategory.set((value ?? '') as EnquiryCategory | '');
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.enquiryService
      .create({
        name: value.name!,
        email: value.email || undefined,
        phone: value.phone!,
        subject: value.subject || undefined,
        message: value.message || undefined,
        product: value.product || undefined,
        source: value.source as EnquirySource,
        status: value.status as EnquiryStatus,
        category: value.category || undefined,
        subCategory: value.subCategory || undefined,
        firmName: value.firmName || undefined,
        website: value.website || undefined,
        city: value.city || undefined,
        address: value.address || undefined,
        state: value.state || undefined,
      })
      .subscribe({
        next: (res) => this.router.navigate(['/dashboard/enquiries', res.data._id]),
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not add this lead');
        },
      });
  }
}
