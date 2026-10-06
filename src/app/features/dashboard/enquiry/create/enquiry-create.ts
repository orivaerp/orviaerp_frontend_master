import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EnquiryService, ImportResult } from '../../../../core/services/enquiry.service';
import {
  LEAD_IMPORT_ALLOWED_VALUES,
  LEAD_IMPORT_HEADERS,
  buildLeadImportSampleCsv,
} from '../../../../shared/data/lead-import-sample';
import { Icon } from '../../../../shared/components/icon/icon';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { User } from '../../../../core/models/user.model';
import { INDIA_CITIES, INDIA_STATES } from '../../../../shared/data/india-locations';
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
import { formatEnumLabel } from '../../../../shared/utils/format-label';

@Component({
  selector: 'app-enquiry-create',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './enquiry-create.html',
})
export class EnquiryCreate {
  private readonly fb = inject(FormBuilder);
  private readonly enquiryService = inject(EnquiryService);
  readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);

  readonly cities = INDIA_CITIES;
  readonly states = INDIA_STATES;
  readonly sources = ENQUIRY_SOURCES;
  readonly statuses = ENQUIRY_STATUSES;
  readonly categories = ENQUIRY_CATEGORIES;
  readonly label = formatEnumLabel;

  private readonly userAdminService = inject(UserAdminService);

  readonly products = signal<Product[]>([]);
  /** Everyone an admin can assign the new lead to. */
  readonly assignees = signal<User[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly createdLead = signal<Enquiry | null>(null);

  readonly importHeaders = LEAD_IMPORT_HEADERS;
  readonly importAllowed = LEAD_IMPORT_ALLOWED_VALUES;
  readonly importing = signal(false);
  readonly importResult = signal<ImportResult | null>(null);
  readonly importError = signal('');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    subject: ['', [Validators.maxLength(200)]],
    message: ['', [Validators.minLength(5)]],
    product: [''],
    source: ['website' as EnquirySource, [Validators.required]],
    status: ['new' as EnquiryStatus, [Validators.required]],
    assignedTo: [''],
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
        assignedTo: this.authService.isAdmin() ? value.assignedTo || undefined : undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.createdLead.set(res.data);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not add this lead');
        },
      });
  }

  downloadSampleCsv(): void {
    const blob = new Blob([buildLeadImportSampleCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads-import-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importResult.set(null);
    this.importError.set('');

    const reader = new FileReader();
    reader.onload = () => {
      this.enquiryService.importCsv(String(reader.result)).subscribe({
        next: (res) => {
          this.importing.set(false);
          this.importResult.set(res.data);
        },
        error: (err) => {
          this.importing.set(false);
          this.importError.set(err?.error?.message ?? 'Could not import this CSV');
        },
      });
    };
    reader.onerror = () => {
      this.importing.set(false);
      this.importError.set('Could not read that file');
    };
    reader.readAsText(file);
    input.value = '';
  }

  /** Closes the success modal and clears the form so the next lead can be added right away. */
  closeSuccess(): void {
    this.createdLead.set(null);
    this.form.reset({ source: 'website', status: 'new', category: '', assignedTo: '' });
  }
}
